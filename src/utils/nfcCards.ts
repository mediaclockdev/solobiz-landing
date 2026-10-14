import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";

export type NFCCardStatus = "unclaimed" | "active" | "disabled";

export interface NFCCard {
  cardId: string;
  status: NFCCardStatus;
  businessCardUrl: string;
  userId: string | null;
  createdAt?: any;
}

// ---------------- ADD ----------------
export async function addNFCCard(cardId: string) {
  await setDoc(doc(db, "nfc_cards", cardId), {
    cardId,
    status: "unclaimed",
    businessCardUrl: "",
    userId: null,
    createdAt: serverTimestamp(),
  });
}

// ---------------- LIST (PAGINATED) ----------------
export async function getNFCCardsPaginated(
  pageSize: number,
  lastDoc: any = null
) {
  let q = query(
    collection(db, "nfc_cards"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      collection(db, "nfc_cards"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snap = await getDocs(q);

  return {
    cards: snap.docs.map((d) => d.data() as NFCCard),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
  };
}

// ---------------- UPDATE ----------------
export async function updateNFCCard(
  cardId: string,
  data: Partial<NFCCard>
) {
  await updateDoc(doc(db, "nfc_cards", cardId), data);
}

// ---------------- DELETE ----------------
export async function deleteNFCCard(cardId: string) {
  await deleteDoc(doc(db, "nfc_cards", cardId));
}
