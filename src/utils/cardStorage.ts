"use client";
import { db } from "@/services/firebase";
import { BusinessCard } from "@/types/businessCard";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

const STORAGE_KEY = "business_cards";
export const SESSION_STORAGE_KEY = "session_business_cards";
const OLD_STORAGE_KEY = "savedCards";

// Migration function to move cards from old storage to new storage
const migrateOldCards = (): void => {
  try {
    if (typeof window === "undefined") return;

    const oldCards = localStorage.getItem(OLD_STORAGE_KEY);
    const newCards = localStorage.getItem(STORAGE_KEY);

    if (oldCards && !newCards) {
      console.log("Migrating cards from old storage key to new storage key");
      localStorage.setItem(STORAGE_KEY, oldCards);
      localStorage.removeItem(OLD_STORAGE_KEY);
    }
  } catch (error) {
    console.error("Error during card migration:", error);
  }
};

export const loadBusinessCards = (): BusinessCard[] => {
  try {
    if (typeof window === "undefined") return [];

    // Run migration on first load
    migrateOldCards();

    // Try new storage key first
    let saved = localStorage.getItem(STORAGE_KEY);

    // If no cards in new storage, check old storage as fallback
    if (!saved) {
      saved = localStorage.getItem(OLD_STORAGE_KEY);
    }

    const cards = saved ? JSON.parse(saved) : [];

    return cards;
  } catch (error) {
    console.error("Error loading business cards:", error);
    return [];
  }
};

export const loadSessionBusinessCards = (): BusinessCard[] => {
  try {
    if (typeof window === "undefined") return [];

    // Run migration on first load
    migrateOldCards();

    // Try new storage key first
    let saved = localStorage.getItem(SESSION_STORAGE_KEY);

    const cards = saved ? JSON.parse(saved) : [];

    return cards;
  } catch (error) {
    console.error("Error loading business cards:", error);
    return [];
  }
};

export const loadDBBusinessCards = async (): Promise<BusinessCard[]> => {
  try {
    if (typeof window === "undefined") return [];

    const cardsRef = collection(db, "cards");
    const snapshot = await getDocs(cardsRef);
    const cards: BusinessCard[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BusinessCard[];
    return cards;
  } catch (error) {
    console.error("Error loading business cards:", error);
    return [];
  }
};

export const loadDBBusinessCardsAccessories = async (
  uid: string,
): Promise<BusinessCard[]> => {
  try {
    if (typeof window === "undefined" || !uid) return [];

    const cardsRef = collection(db, "cards");
    const q = query(cardsRef, where("uid", "==", uid)); // Filter by uid

    const snapshot = await getDocs(q);

    const cards: BusinessCard[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BusinessCard[];

    return cards;
  } catch (error) {
    console.error("Error loading business cards:", error);
    return [];
  }
};

export const saveBusinessCard = (card: BusinessCard): void => {
  try {
    const cards = loadBusinessCards();
    const existingIndex = cards.findIndex(
      (c) => c.metadata.id === card.metadata.id,
    );

    if (existingIndex >= 0) {
      cards[existingIndex] = card;
    } else {
      cards.push(card);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error("Error saving business card:", error);
  }
};

export const saveSessionBusinessCard = (card: BusinessCard): void => {
  try {
    const cards = loadSessionBusinessCards();
    const existingIndex = cards.findIndex(
      (c) => c.metadata.id === card.metadata.id,
    );

    if (existingIndex >= 0) {
      cards[existingIndex] = card;
    } else {
      cards.push(card);
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error("Error saving business card:", error);
  }
};

export const deleteBusinessCard = (cardId: string): void => {
  try {
    const cards = loadBusinessCards();
    const filtered = cards.filter((c) => c.metadata.id !== cardId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting business card:", error);
  }
};

export const checkLocalCardExist = (cardId: string): boolean => {
  try {
    const cards = loadBusinessCards();
    const filtered = cards.filter((c) => c.metadata.id !== cardId);
    if (filtered?.length) return true;
    return false;
  } catch (error) {
    console.error("Error deleting business card:", error);
  }
};

// export const deleteDatabaseBusinessCard = async (
//   cardId: string
// ): Promise<void> => {
//   try {
//     const cardsRef = collection(db, "cards");
//     const q = query(cardsRef, where("metadata.id", "==", cardId));
//     const querySnapshot = await getDocs(q);

//     const updatePromises = querySnapshot.docs.map((document) =>
//       updateDoc(doc(db, "cards", document.id), { isActive: false })
//     );

//     await Promise.all(updatePromises);

//     console.log(
//       `Deactivated ${updatePromises.length} card(s) with metadata.id=${cardId}`
//     );
//   } catch (error) {
//     console.error("Error deactivating business card:", error);
//   }
// };

export const deleteDatabaseBusinessCard = async (
  cardId: string,
): Promise<void> => {
  try {
    const cardsRef = collection(db, "cards");
    const q = query(cardsRef, where("metadata.id", "==", cardId));
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((document) =>
      deleteDoc(doc(db, "cards", document.id)),
    );
    await Promise.all(deletePromises);
    console.log(
      `Deleted ${deletePromises.length} card(s) with metadata.id=${cardId}`,
    );
  } catch (error) {
    console.error("Error deleting business card:", error);
  }
};

export const toggleCardFavorite = (cardId: string): void => {
  try {
    const cards = loadBusinessCards();
    const card = cards.find((c) => c.metadata.id === cardId);
    if (card) {
      card.metadata.favorite = !card.metadata.favorite;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
  }
};

export const isUrlNameAvailable = async (
  urlName: string,
  excludeCardId?: string,
  _dBCards?: boolean,
): Promise<boolean> => {
  try {
    if (!urlName || !urlName.trim()) {
      return false;
    }
    const cleanUrlName = urlName.trim();
    const normalizedUrlName = cleanUrlName.toLowerCase();

    // 1. Check local storage
    const localCards = loadBusinessCards();
    const existsLocally = localCards.some(
      (card) =>
        card.urlName?.trim().toLowerCase() === normalizedUrlName &&
        (!excludeCardId || card.metadata?.id !== excludeCardId),
    );

    if (existsLocally) {
      return false;
    }

    // 2. Check Firestore database
    if (typeof window !== "undefined") {
      const cardsRef = collection(db, "cards");

      // Check lowercase normalized name
      const q = query(cardsRef, where("urlName", "==", normalizedUrlName));
      const querySnapshot = await getDocs(q);

      const existsInDb = querySnapshot.docs.some((docSnap) => {
        const docData = docSnap.data();
        if (excludeCardId) {
          if (docSnap.id === excludeCardId) return false;
          if (docData?.metadata?.id === excludeCardId) return false;
        }
        return true;
      });

      if (existsInDb) {
        return false;
      }

      // If user typed uppercase or mixed case, also check exact string
      if (cleanUrlName !== normalizedUrlName) {
        const qOriginal = query(cardsRef, where("urlName", "==", cleanUrlName));
        const snapOriginal = await getDocs(qOriginal);
        const existsOriginal = snapOriginal.docs.some((docSnap) => {
          const docData = docSnap.data();
          if (excludeCardId) {
            if (docSnap.id === excludeCardId) return false;
            if (docData?.metadata?.id === excludeCardId) return false;
          }
          return true;
        });

        if (existsOriginal) {
          return false;
        }
      }

      // Check if document exists with document ID matching the urlName
      try {
        const docRef = doc(db, "cards", normalizedUrlName);
        const directDocSnap = await getDoc(docRef);
        if (directDocSnap.exists()) {
          const directData = directDocSnap.data();
          const isOwnDoc =
            Boolean(excludeCardId) &&
            (directDocSnap.id === excludeCardId ||
              directData?.metadata?.id === excludeCardId);
          if (!isOwnDoc) {
            return false;
          }
        }
      } catch {
        // Continue if direct doc check fails or is restricted
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking URL name availability:", error);
    return true;
  }
};

export const generateUniqueUrlName = async (
  baseName: string,
  excludeCardId?: string,
  dBCards?: boolean,
): Promise<string> => {
  try {
    const cleanBase = (baseName || "card").trim().toLowerCase();
    let uniqueName = cleanBase;
    let attempts = 0;

    while (
      !(await isUrlNameAvailable(uniqueName, excludeCardId, dBCards)) &&
      attempts < 20
    ) {
      attempts++;
      const randomNumber = Math.floor(100 + Math.random() * 900);
      uniqueName = `${cleanBase}-${randomNumber}`;
    }

    return uniqueName;
  } catch (error) {
    console.error("Error generating unique URL name:", error);
    return baseName;
  }
};

export const generateRandomUrlSuggestions = async (
  baseName: string,
  excludeCardId?: string,
  dBCards?: boolean,
  count: number = 3,
): Promise<string[]> => {
  try {
    const cleanBase = (baseName || "card").trim().toLowerCase();
    const suggestions = new Set<string>();
    let attempts = 0;

    while (suggestions.size < count && attempts < 25) {
      attempts++;
      const randomNumber = Math.floor(100 + Math.random() * 900);
      const candidate = `${cleanBase}-${randomNumber}`;

      const isAvailable = await isUrlNameAvailable(
        candidate,
        excludeCardId,
        dBCards,
      );

      if (isAvailable) {
        suggestions.add(candidate);
      }
    }

    return Array.from(suggestions);
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [];
  }
};
