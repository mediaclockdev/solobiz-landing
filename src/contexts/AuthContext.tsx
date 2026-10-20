"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { auth, db } from "@/services/firebase";
import {
  onAuthStateChanged,
  updatePassword,
  updateProfile,
  applyActionCode,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { checkActionCode } from "firebase/auth";
import {
  loadSessionBusinessCards,
  SESSION_STORAGE_KEY,
} from "@/utils/cardStorage";

// ----------------- Types -----------------
export interface UserData {
  uid: string;
  name?: string;
  email?: string;
  createdAt?: string;
  lastUpdated?: string;
  isVerify?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: (FirebaseUser & UserData) | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  register: (
    name: string,
    email: string,
    password: string,
    businessCategory: string,
    clientsPreference: string
  ) => Promise<{ success: boolean; error?: string }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  updateUser: (updates: { name?: string; password?: string }) => Promise<{
    success: boolean;
    error?: string;
  }>;
  verifyEmail: (
    oobCode: string
  ) => Promise<{ success: boolean; error?: string; email?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ----------------- Provider -----------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(FirebaseUser & UserData) | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;

          if (userData.status !== "active") {
            // Must clear loading before bailing out, otherwise every consumer
            // of `isLoading` waits forever.
            setUser(null);
            setIsLoading(false);
            return;
          }

          if (userData.isVerify) {
            if (userData?.subscriptionEndDate?.toDate() < new Date()) {
              await updateDoc(userRef, {
                planType: "free",
              });
            }
            setUser({ ...firebaseUser, ...userData });
            setIsLoggedIn(userData.isLoggedIn ?? false);
            setIsLoading(false);
          } else {
            // Unverified account - still a resolved auth state.
            setUser(null);
            setIsLoading(false);
          }
        } else {
          setUser(null);
          setIsLoading(false);
        }
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoggedIn(false);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ----------------- Auth Methods -----------------
  const register = async (
    name: string,
    email: string,
    password: string,
    businessCategory: string,
    clientsPreference: string
  ) => {
    return { success: true };
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      if (!firebaseUser.emailVerified) {
        try {
          const continueUrl =
            typeof window !== "undefined"
              ? `${window.location.origin}/login?verified=true`
              : undefined;
          await sendEmailVerification(
            firebaseUser,
            continueUrl
              ? { url: continueUrl, handleCodeInApp: false }
              : undefined,
          );
        } catch (resendErr: any) {
          if (resendErr?.code === "auth/unauthorized-continue-uri") {
            try {
              await sendEmailVerification(firebaseUser);
            } catch {}
          }
        }
        await signOut(auth);
        return {
          success: false,
          error: "Please verify your email before logging in. We have sent a new verification link to your email.",
        };
      }

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      let userData: UserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || "",
      };

      if (userDoc.exists()) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userFirestoreData = userDoc.data();

        // Check if user status is active
        if (userFirestoreData.status !== "active") {
          return {
            success: false,
            error: "Your account is not active. Please contact support.",
          };
        }
        updateDoc(userRef, { isLoggedIn: true, lastLogin: serverTimestamp() });
        userData = { ...userData, ...userDoc.data() };
      }

      setUser({ ...firebaseUser, ...userData });
      setIsLoggedIn(true);
      // localStorage.setItem("isLoggedIn", "true");
      // localStorage.setItem("userData", JSON.stringify(userData));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userData");
      setUser(null);
      setTimeout(() => {
        setIsLoggedIn(false);
      }, 500);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (updates: { name?: string; password?: string }) => {
    if (!user) return { success: false, error: "User not logged in" };

    try {
      const userRef = doc(db, "users", user.uid);
      const firestoreUpdates: Partial<UserData> = {
        lastUpdated: new Date().toISOString(),
      };

      if (updates.name) {
        await updateProfile(auth.currentUser!, { displayName: updates.name });
        firestoreUpdates.name = updates.name;
      }

      if (updates.password) {
        await updatePassword(auth.currentUser!, updates.password);
      }

      await updateDoc(userRef, firestoreUpdates);

      setUser((prev) =>
        prev
          ? { ...prev, ...updates, lastUpdated: firestoreUpdates.lastUpdated }
          : null
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const syncSessionLocalCards = async (userID) => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);

      let cards = JSON.parse(stored);
      const existingIndex = cards.findIndex(
        (c) => c.profile?.userEmail === userID
      );
      const cardID = cards[existingIndex].metadata?.id;
      const card = cards[0];
      const cardsRef = collection(db, "cards");
      const q = query(
        cardsRef,
        where("uid", "==", userID)
        // where("sync", "==", true)
      );
      const querySnapshot = await getDocs(q);
      const count = querySnapshot.size;

      let syncCardSetting = 2;
      if (count >= syncCardSetting) {
        return;
      } else {
        const localCards = loadSessionBusinessCards();
        const selectedCard = localCards.find((c) => c.metadata.id === cardID);
        if (selectedCard) {
          const cardRef = doc(db, "cards", cardID);
          selectedCard.uid = userID;
          selectedCard.sync = true;
          selectedCard.isActive = true;
          await setDoc(cardRef, selectedCard);

          localStorage.removeItem(SESSION_STORAGE_KEY);

          return;
        }
      }
    } catch (error) {
      console.error("Error syncing local cards:", error);
    }
  };

  const checkVerification = async (userID) => {
    const expiresAt = Number(localStorage.getItem("signupTimerExpiresAt"));
    if (!expiresAt) return;
    const remainingTime = expiresAt - Date.now();

    // Timer expired
    if (remainingTime <= 0) {
      localStorage.removeItem("signupTimerExpiresAt");
      return true;
    }

    const cards = await loadSessionBusinessCards();
    if (!cards?.length) return false;
    const existingIndex = cards.findIndex(
      (c) => c.profile?.userEmail === userID
    );
    const email = cards[existingIndex]?.profile?.userEmail;
    console.log("email", email);
    if (!email) return false;

    const userDoc = await getDoc(doc(db, "users", email));
    if (!userDoc.exists()) return false;

    const userData = userDoc.data();
    console.log("userData", userData);

    // Verified within 1 hour
    if (userData.isVerify === true) {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const sessionCards = JSON.parse(stored);
        if (sessionCards.length > 0) {
          await syncSessionLocalCards(userID);
        }
      }

      localStorage.removeItem("signupTimerExpiresAt");
      return true; // stop polling
    }

    return false; // keep polling
  };

  const verifyEmail = async (oobCode: string) => {
    try {
      // 1. Decode the action code → get the email if available
      let email = "";
      try {
        const info = await checkActionCode(auth, oobCode);
        email = info.data.email || "";
      } catch (checkErr) {
        console.warn("Could not inspect action code before applying:", checkErr);
      }

      // 2. Apply email verification
      await applyActionCode(auth, oobCode);

      // 3. Find user by email from Firestore and sync active status
      if (email) {
        try {
          const q = query(
            collection(db, "users"),
            where("email", "==", email.toLowerCase().trim()),
          );
          let querySnapshot = await getDocs(q);

          // Fallback query with raw email if lowercased didn't match
          if (querySnapshot.empty && email !== email.toLowerCase().trim()) {
            querySnapshot = await getDocs(
              query(collection(db, "users"), where("email", "==", email)),
            );
          }

          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const uid = docSnap.id;
            const userData = docSnap.data();

            // 4. Update Firestore
            await updateDoc(doc(db, "users", uid), {
              isVerify: true,
              status: "active",
            });

            // 5. Optional: Send to external API
            if (userData?.businessCategory && userData?.clientsPreference) {
              await setDataBase(
                userData.name || "",
                email,
                userData.businessCategory,
                userData.clientsPreference,
              ).catch((e) => console.warn("setDataBase error:", e));
            }

            checkVerification(docSnap.id);
          }
        } catch (dbErr) {
          console.warn("Post-verification Firestore sync error (non-fatal):", dbErr);
        }
      }

      return { success: true, email };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to verify email" };
    }
  };

  // const verifyEmail = async (oobCode: string) => {
  //   try {
  //     await applyActionCode(auth, oobCode);
  //     await auth.currentUser?.reload();

  //     const refreshedUser = auth.currentUser;
  //     if (refreshedUser) {
  //       const userRef = doc(db, "users", refreshedUser.uid);
  //       updateDoc(userRef, { isVerify: true }).then(async (res) => {
  //         const userDoc = await getDoc(userRef);
  //         let businessCategory: string | undefined;
  //         let clientsPreference: string | undefined;
  //         if (userDoc.exists()) {
  //           businessCategory = (userDoc.data() as UserData).businessCategory;
  //           clientsPreference = (userDoc.data() as UserData).clientsPreference;
  //         }

  //         await setDataBase(
  //           refreshedUser.displayName,
  //           refreshedUser.email,
  //           businessCategory,
  //           clientsPreference
  //         );
  //       });
  //     }

  //     return { success: true };
  //   } catch (err: any) {
  //     return { success: false, error: err.message };
  //   }
  // };

  const setDataBase = async (
    displayName: string,
    email: string,
    businessCategory?: string,
    clientsPreference?: string
  ) => {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: displayName,
        email,
        businessCategory,
        clientsPreference,
      }),
    });

    const data = await res.json();
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        register,
        login,
        logout,
        updateUser,
        isLoggedIn,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
