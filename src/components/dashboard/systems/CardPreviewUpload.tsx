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

export function CardPreviewUpload() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [storedImage, setStoredImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const CARD_DOC_ID = "mainCard";

  const fetchImage = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoredImage(data.image || null);
      } else {
        setStoredImage(null);
      }
    } catch (err) {
      console.error("Failed to fetch image:", err);
    }
  };

  useEffect(() => {
    fetchImage();
  }, []);

  const handleImageChange = async (_: string[], file: File) => {
    if (!user) return;

    const storage = getStorage();

    try {
      setIsLoading(true);
      // Upload new image
      const newRef = ref(
        storage,
        `cardPreviews/images/${Date.now()}_${file.name}`
      );
      await uploadBytes(newRef, file);
      const url = await getDownloadURL(newRef);

      const newImage = {
        url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.uid,
      };

      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);

      // Delete old image from storage if exists
      if (storedImage) {
        const pathStart = storedImage.url.indexOf("/o/") + 3;
        const pathEnd = storedImage.url.indexOf("?");
        const fullPath = decodeURIComponent(
          storedImage.url.substring(pathStart, pathEnd)
        );
        const oldRef = ref(storage, fullPath);
        await deleteObject(oldRef).catch(() => null);
      }

      // Update Firestore
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, { image: newImage });
      } else {
        await setDoc(docRef, { image: newImage });
      }

      setStoredImage(newImage);
      showToast("Card Preview Image uploaded successfully!", "success");
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to upload image:", err);
    }
  };

  const handleDelete = async () => {
    if (!storedImage) return;

    try {
      setIsLoading(true);
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);

      // Delete from storage
      const pathStart = storedImage.url.indexOf("/o/") + 3;
      const pathEnd = storedImage.url.indexOf("?");
      const fullPath = decodeURIComponent(
        storedImage.url.substring(pathStart, pathEnd)
      );
      const storage = getStorage();
      const imageRef = ref(storage, fullPath);
      await deleteObject(imageRef);

      // Remove from Firestore
      await updateDoc(docRef, { image: null });

      setStoredImage(null);
      showToast("Card Preview Image deleted successfully!", "success");
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to delete image:", err);
    }
  };

  return (
    <div className="space-y-6">
      <ImageUploadCard
        title="Card Preview Image"
        description="Upload a card preview image"
        initialImage={storedImage?.url || undefined}
        onImageChange={handleImageChange}
        acceptedTypes="image/png,image/jpeg,image/webp"
        maxSize={5}
        className="w-full"
      />

      {(storedImage || isLoading) && (
        <div>
          <h4 className="text-sm font-medium mb-2">Stored Preview Image</h4>
          <div className="relative w-48 h-48">
            {isLoading ? (
              <div className="w-full h-full bg-background rounded-md border p-4 flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
              </div>
            ) : (
              <img
                src={storedImage.url}
                alt="Card Preview"
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
      )}
    </div>
  );
}
