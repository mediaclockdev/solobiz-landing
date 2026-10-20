"use client";

/**
 * The one implementation of "turn a freshly created Firebase auth user into a
 * SoloBizCards account".
 *
 * It was the back half of SignUpModal.handleSubmit. The /welcome campaign
 * funnel needs the same work done at a different moment - it takes email and
 * password on one screen and the name, category and preference two screens
 * later - so the modal could not simply be reused. Copying the block would
 * have given the campaign signups no referrals document, no parent/grandparent
 * credit and no earnings configuration, and nobody would have noticed until a
 * referrer asked where their commission went.
 *
 * Lifted verbatim, so both callers do exactly the same thing. SignUpModal now
 * calls this immediately after createUserWithEmailAndPassword; the funnel calls
 * it when its wizard finishes.
 *
 * Side effects, in order: sets the auth displayName, resolves IP and location,
 * reads the membership / earnings / pricing settings, credits the referrer and
 * their parent, writes users/{uid} and referrals/{uid}, and sends the
 * verification email. The caller owns the toast and whatever comes next.
 */

import { db } from "@/services/firebase";
import { sendEmailVerification, updateProfile, User } from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  collection,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

function generateReferralCode(name: string, uid: string) {
  const shortName = name.replace(/\s+/g, "").substring(0, 3).toUpperCase();
  const shortUid = uid.slice(-4).toUpperCase();
  return `${shortName}${shortUid}`;
}

const getIpAddress = async () => {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();

    // Check if valid IP
    if (data?.ip && data.ip.trim() !== "") {
      return data.ip;
    }

    // Fallback IP if empty or invalid
    return "5.182.32.243";
  } catch (err) {
    console.error("IP fetch failed:", err);

    // Fallback IP if API breaks
    return "5.182.32.243";
  }
};

const getAccurateLocation = async () => {
  try {
    // 1️⃣ Try Google Geolocation API first
    const googleKey = process.env.NEXT_GOOGLE_API_KEY;

    const googleResponse = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyBcZaByAZLe7qQZAYhKWtc2O9Bn22PAD2E`,
      {
        method: "POST",
      },
    );

    const data = await googleResponse.json();

    console.log("Google API response:", data);

    // Safety checks
    if (
      data &&
      data.location &&
      typeof data.location.lat === "number" &&
      typeof data.location.lng === "number"
    ) {
      return {
        latitude: data.location.lat,
        longitude: data.location.lng,
        accuracy: data.accuracy || null,
        source: "google_api",
      };
    }

    console.warn("Google API did not return valid location, falling back...");

    // 2️⃣ Fallback to Browser Geolocation
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: "browser",
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    });
  } catch (error) {
    console.error("Location fetch failed", error);

    throw new Error("Could not fetch location");
  }
};

// Get browser GPS location (prompts user)
const getBrowserLocation = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported.");
      return resolve(null);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("User denied or error getting location:", error);
        resolve(null); // <— IMPORTANT: Never reject
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });
};

export interface CompleteSignupProfileInput {
  /** The user createUserWithEmailAndPassword just returned. */
  user: User;
  name: string;
  email: string;
  businessCategory: string;
  clientsPreference: string;
  /** The ?ref= code that brought them in, or null for a direct signup. */
  referralCode: string | null;
  /**
   * Where Firebase should send them after they click the link in the
   * verification email. Firebase appends it to the action link as
   * `continueUrl`, which the action handler passes on to /verify-email.
   *
   * Omitted by SignUpModal, so the main signup keeps its existing link and
   * existing destination. The /welcome funnel passes its own login page, so a
   * campaign signup comes back into the campaign rather than the dashboard.
   *
   * The domain must be in Firebase Auth's Authorized domains list.
   */
  verifyContinueUrl?: string;
  /**
   * The "send me the latest updates and news" opt-in. Defaults to true, which
   * is what the value was hard-coded to before the /welcome funnel put a real
   * checkbox in front of it - so SignUpModal, which does not pass this, keeps
   * writing exactly what it always wrote.
   */
  wantsUpdates?: boolean;
}

async function dispatchVerificationEmail(
  user: User,
  verifyContinueUrl?: string,
): Promise<void> {
  try {
    await sendEmailVerification(
      user,
      verifyContinueUrl
        ? { url: verifyContinueUrl, handleCodeInApp: false }
        : undefined,
    );
  } catch (sdkErr: any) {
    if (sdkErr?.code === "auth/unauthorized-continue-uri") {
      console.warn("Domain not allowlisted for continueUrl; sending verification email without continueUrl.");
      try {
        await sendEmailVerification(user);
      } catch (retryErr) {
        console.warn("sendEmailVerification retry failed:", retryErr);
      }
    } else {
      console.warn("sendEmailVerification failed:", sdkErr);
    }
  }
}

export async function completeSignupProfile({
  user,
  name,
  email,
  businessCategory,
  clientsPreference,
  referralCode,
  wantsUpdates = true,
  verifyContinueUrl,
}: CompleteSignupProfileInput): Promise<void> {
  /* Run once per account, ever.
   *
   * The referrer's payout below is a read-modify-write - `childBalance:
   * (parentRefData.childBalance || 0) + earningAmount` - so running this twice
   * pays them twice. In SignUpModal that could not happen, because
   * createUserWithEmailAndPassword came first and a second attempt failed with
   * auth/email-already-in-use before reaching any of this.
   *
   * The /welcome funnel splits those two apart: the account is created on the
   * signup screen and this runs at the end of onboarding, so a refresh, a back
   * button or a retry after a network blip can land here again with a valid
   * session. referrals/{uid} is written at the very end of a successful run, so
   * its existence is the marker that this account is already set up.
   */
  const existingReferral = await getDoc(doc(db, "referrals", user.uid));
  if (existingReferral.exists()) {
    await dispatchVerificationEmail(user, verifyContinueUrl);
    return;
  }

  await updateProfile(user, { displayName: name });

  // Vars
  let parentUid: string | null = null;
  let grandParentUid: string | null = null;
  const childIp = await getIpAddress();

  let browserLocation: any = null;

  try {
    // Try normal browser-based geolocation first
    browserLocation = await getBrowserLocation();
    console.log("browserLocation", location);
  } catch (err) {
    console.warn("Primary location failed or denied:", err);

    try {
      // Fallback: try more accurate method (GPS / external API)
      browserLocation = await getAccurateLocation();
    } catch (fallbackErr) {
      console.error("Fallback location also failed:", fallbackErr);
      browserLocation = null; // Final fallback
    }
  }

  // If still null, try accurate location again
  if (!browserLocation) {
    const location = await getAccurateLocation();
    console.log("location (forced accurate)", location);
    browserLocation = location;
  }

  // Fetch MembershipLevel settings from Firestore
  const membershipSettingsRef = doc(db, "settings", "ReferralMembershipLevel");
  const membershipSnap = await getDoc(membershipSettingsRef);

  let membershipData: any = {};
  if (membershipSnap.exists()) {
    const data = membershipSnap.data();
    membershipData = {
      l2Child: data.l2Child ?? null,
      l3LeveledUps: data.l3LeveledUps ?? null,
      l4Multiplier: data.l4Multiplier ?? null,
      l5Multiplier: data.l5Multiplier ?? null,
      l6Multiplier: data.l6Multiplier ?? null,
      l3Total: data.l3Total ?? null,
      l4Total: data.l4Total ?? null,
      l5Total: data.l5Total ?? null,
      l6Total: data.l6Total ?? null,
    };
  }

  if (referralCode) {
    const refeQuery = query(
      collection(db, "referrals"),
      where("referralCode", "==", referralCode),
    );
    const refeSnap = await getDocs(refeQuery);

    if (!refeSnap.empty) {
      const parentRefDoc = refeSnap.docs[0];
      const parentRefData = parentRefDoc.data();
      parentUid = parentRefData.uid;

      let childEarnings = 0;
      let grandchildEarnings = 0;
      let operatingCostRate = 0;

      const settingsRef = doc(db, "settings", "ReferralEarningRate");
      const pricingRequirement = doc(db, "settings", "PricingRequirement");

      const snapPricingRequirement = await getDoc(pricingRequirement);
      if (snapPricingRequirement.exists()) {
        operatingCostRate = snapPricingRequirement.data().proUpgradePerYear;
      }

      const snap1 = await getDoc(settingsRef);
      if (snap1.exists()) {
        childEarnings = snap1.data().childEarnings;
        grandchildEarnings = snap1.data().grandchildEarnings;
      }
      let childBalanceEarnings = parentRefData.childBalanceEarnings || {};
      let balanceEarnings = parentRefData.balanceEarnings || {};
      let earningsCost = parentRefData.earningsCost || {};

      const earningAmount =
        (Number(operatingCostRate) * Number(childEarnings)) / 100;

      // Create a clean object to avoid prototype pollution or undefined keys
      childBalanceEarnings = {
        ...childBalanceEarnings,
        [user.uid]: (childBalanceEarnings[user.uid] || 0) + earningAmount,
      };
      balanceEarnings = {
        ...balanceEarnings,
        [user.uid]: (balanceEarnings[user.uid] || 0) + earningAmount,
      };
      earningsCost = {
        ...earningsCost,
        [user.uid]: childEarnings,
      };
      await updateDoc(parentRefDoc.ref, {
        children: arrayUnion(user.uid),
        childrenIP: [...(parentRefData.childrenIP || []), childIp],
        childrenLocation: [
          ...(parentRefData.childrenLocation || []),
          browserLocation,
        ],
        childBalance:
          (parentRefData.childBalance || 0) +
          operatingCostRate * (childEarnings / 100),
        //   balanceEarnings,
        childBalanceEarnings,
        earningsCost,
        balance:
          (parentRefData.balance || 0) +
          operatingCostRate * (childEarnings / 100),
      });

      if (parentRefData.parentUid) {
        grandParentUid = parentRefData.parentUid;
        const gpRef = doc(db, "referrals", grandParentUid);
        const gpSnap = await getDoc(gpRef);

        if (gpSnap.exists()) {
          const gpData = gpSnap.data();
          let balanceEarnings = gpData.balanceEarnings || {};

          let earningsCost = gpData.earningsCost || {};

          let parentBalanceEarnings = gpData.parentBalanceEarnings || {};

          const earningAmount =
            (Number(operatingCostRate) * Number(grandchildEarnings)) / 100;

          // Create a clean object to avoid prototype pollution or undefined keys
          parentBalanceEarnings = {
            ...parentBalanceEarnings,
            [user.uid]: (childBalanceEarnings[user.uid] || 0) + earningAmount,
          };
          balanceEarnings = {
            ...balanceEarnings,
            [user.uid]: (balanceEarnings[user.uid] || 0) + earningAmount,
          };
          earningsCost = {
            ...earningsCost,
            [user.uid]: grandchildEarnings,
          };

          await updateDoc(gpRef, {
            grandchildren: arrayUnion(user.uid),
            grandchildrenIP: arrayUnion(childIp),
            parentBalance:
              (gpData.parentBalance || 0) +
              operatingCostRate * (grandchildEarnings / 100),
            parentBalanceEarnings,
            //   balanceEarnings,
            earningsCost,
            balance:
              (gpData.balance || 0) +
              operatingCostRate * (grandchildEarnings / 100),
          });
        }
      }
    }
  }

  const earningSettingsRef = doc(db, "settings", "ReferralEarningRate");
  const earningshipSnap = await getDoc(earningSettingsRef);

  let earningshipData: any = {};
  if (earningshipSnap.exists()) {
    const data = earningshipSnap.data();

    earningshipData = {
      childEarnings1: data.childEarnings ?? 0,
      grandchildEarnings1: data.grandchildEarnings ?? 0,
      operatingCostRate1: data.operatingCostRate ?? 0,
    };
  } else {
    earningshipData = {
      childEarnings1: 0,
      grandchildEarnings1: 0,
      operatingCostRate1: 0,
    };
  }

  const trialSettingsRef = doc(db, "settings", "PricingRequirement");
  const trialshipSnap = await getDoc(trialSettingsRef);

  let trialhipData: any = {};
  if (trialshipSnap.exists()) {
    const data = trialshipSnap.data();

    trialhipData = {
      freeTrialPeriod: data.freeTrialPeriod ?? 0,
    };
  } else {
    trialhipData = {
      freeTrialPeriod: 0,
    };
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      userChildEarning: earningshipData.childEarnings1,
      userGrandChildEarning: earningshipData.grandchildEarnings1,
      operatingCostRate: earningshipData.operatingCostRate1,

      displayName: name,
      email,
      businessCategory,
      clientsPreference,
      role: "user",
      createdAt: new Date(),
      isVerify: false,
      isLoggedIn: false,
      planType: "free",
      referralCode: generateReferralCode(name, user.uid),
      referredBy: referralCode || null,
      ipAddress: childIp,
      status: "inactive",
      location: browserLocation
        ? {
            latitude: browserLocation.latitude,
            longitude: browserLocation.longitude,
          }
        : null,

      // Membership requirements
      l2Child: membershipData.l2Child ?? null,
      l3LeveledUps: membershipData.l3LeveledUps ?? null,
      l4Multiplier: membershipData.l4Multiplier ?? null,
      l5Multiplier: membershipData.l5Multiplier ?? null,
      l6Multiplier: membershipData.l6Multiplier ?? null,

      // Totals
      l3Total: membershipData.l3Total ?? null,
      l4Total: membershipData.l4Total ?? null,
      l5Total: membershipData.l5Total ?? null,
      l6Total: membershipData.l6Total ?? null,

      notificationPreferences: {
        email: true,
        marketing: wantsUpdates,
        orderUpdates: true,
      },

      freeTrialPeriod: trialhipData.freeTrialPeriod,
    },
    { merge: true },
  );

  await setDoc(doc(db, "referrals", user.uid), {
    Level: 1,
    badgeLevel: 1,
    LevelsUpdate: {
      1: new Date(),
    },
    memberLevel: "Starter",
    uid: user.uid,
    parentUid,
    parents: parentUid ? [parentUid] : [],
    ipAddress: childIp,
    referralCode: generateReferralCode(name, user.uid),
    createdAt: serverTimestamp(),
    balance: 0,
    parentBalance: 0,
    childBalance: 0,
    children: [],
    childrenIP: [],
    childrenLocation: [],
    grandchildren: [],
    grandchildrenIP: [],
  });

  await dispatchVerificationEmail(user, verifyContinueUrl);
}
