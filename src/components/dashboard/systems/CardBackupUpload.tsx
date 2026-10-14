"use client";

import React, { useState, useEffect } from "react";
import { ImageUploadCard } from "./ImageUploadCard";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { X } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export function CardBackupUpload() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [backupCard, setBackupCard] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const CARD_DOC_ID = "mainCard";

  const fetchBackupCard = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBackupCard(data.backupCard || null);
      } else {
        setBackupCard(null);
      }
    } catch (err) {
      console.error("Failed to fetch backup card:", err);
    }
  };

  useEffect(() => {
    fetchBackupCard();
  }, []);

  const handleImageChange = async (_: string[], file: File) => {
    if (!user) return;

    const storage = getStorage();

    try {
      setIsLoading(true);
      // Upload new backup image
      const newRef = ref(
        storage,
        `cardPreviews/backup/${Date.now()}_${file.name}`
      );
      await uploadBytes(newRef, file);
      const url = await getDownloadURL(newRef);

      const newBackupCard = {
        url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.uid,
      };

      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);

      // Delete old backup image from storage if exists
      if (backupCard) {
        const pathStart = backupCard.url.indexOf("/o/") + 3;
        const pathEnd = backupCard.url.indexOf("?");
        const fullPath = decodeURIComponent(
          backupCard.url.substring(pathStart, pathEnd)
        );
        const oldRef = ref(storage, fullPath);
        await deleteObject(oldRef).catch(() => null);
      }

      // Update Firestore
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log()
        await updateDoc(docRef, {
          oldUrl: backupCard,
          backupCard: newBackupCard,
        });
      } else {
        await setDoc(docRef, { backupCard: newBackupCard });
      }

      setBackupCard(newBackupCard);
      showToast("Backup card uploaded successfully!", "success");
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to upload backup card:", err);
    }
  };

  const handleDelete = async () => {
    if (!backupCard) return;

    try {
      setIsLoading(true);

      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);

      // Delete from storage
      const pathStart = backupCard.url.indexOf("/o/") + 3;
      const pathEnd = backupCard.url.indexOf("?");
      const fullPath = decodeURIComponent(
        backupCard.url.substring(pathStart, pathEnd)
      );
      const storage = getStorage();
      const imageRef = ref(storage, fullPath);
      await deleteObject(imageRef);

      // Remove from Firestore
      await updateDoc(docRef, { backupCard: null });

      setBackupCard(null);
      showToast("Backup card deleted successfully!", "success");
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to delete backup card:", err);
    }
  };

  return (
    <div className="space-y-6">
      <ImageUploadCard
        title="Card Backup Image"
        description="Upload a backup image for business cards"
        initialImage={backupCard?.url || undefined}
        onImageChange={handleImageChange}
        acceptedTypes="image/png,image/jpeg,image/webp"
        maxSize={5}
        className="w-full"
      />

      {/* Stored Backup Image */}

      {(backupCard || isLoading) && (
        <div>
          <h4 className="text-sm font-medium mb-2">Backup Card</h4>
          <div className="flex gap-4 flex-wrap">
            <div className="relative w-48 h-48">
              {isLoading ? (
                <div className="w-full h-full bg-background rounded-md border p-4 flex items-center justify-center">
                  <div className="animate-pulse">Loading...</div>
                </div>
              ) : (
                <img
                  src={backupCard.url}
                  alt="Backup Card"
                  className="w-full h-full rounded-md border object-contain"
                />
              )}
              <button
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded"
                onClick={handleDelete}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
