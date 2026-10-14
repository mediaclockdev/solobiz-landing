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

export function OGWebsiteImageUpload() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [ogImage, setOgImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const DOC_ID = "mainCard"; // same doc as backupCard

  const fetchOGImage = async () => {
    try {
      const docRef = doc(db, "cardPreviews", DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOgImage(data.ogImage || null); // fetch ogImage from mainCard doc
      } else {
        setOgImage(null);
      }
    } catch (err) {
      console.error("Failed to fetch OG Website image:", err);
    }
  };

  useEffect(() => {
    fetchOGImage();
  }, []);

  const handleImageChange = async (_: string[], file: File) => {
    if (!user) return;
    const storage = getStorage();

    try {
      setIsLoading(true);

      // Upload new OG image
      const newRef = ref(
        storage,
        `cardPreviews/ogwebsite/${Date.now()}_${file.name}`
      );
      await uploadBytes(newRef, file);
      const url = await getDownloadURL(newRef);

      const newOgImage = {
        url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.uid,
      };

      const docRef = doc(db, "cardPreviews", DOC_ID);

      // Delete old OG image if exists
      if (ogImage) {
        const pathStart = ogImage.url.indexOf("/o/") + 3;
        const pathEnd = ogImage.url.indexOf("?");
        const fullPath = decodeURIComponent(
          ogImage.url.substring(pathStart, pathEnd)
        );
        const oldRef = ref(storage, fullPath);
        await deleteObject(oldRef).catch(() => null);
      }

      // Save in Firestore (in same doc as backupCard)
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, { ogImage: newOgImage });
      } else {
        await setDoc(docRef, { ogImage: newOgImage });
      }

      setOgImage(newOgImage);
      showToast("OG Website image uploaded successfully!", "success");
    } catch (err) {
      console.error("Failed to upload OG Website image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!ogImage) return;

    try {
      setIsLoading(true);

      const docRef = doc(db, "cardPreviews", DOC_ID);

      // Delete from storage
      const pathStart = ogImage.url.indexOf("/o/") + 3;
      const pathEnd = ogImage.url.indexOf("?");
      const fullPath = decodeURIComponent(
        ogImage.url.substring(pathStart, pathEnd)
      );
      const storage = getStorage();
      const imageRef = ref(storage, fullPath);
      await deleteObject(imageRef);

      // Remove from Firestore
      await updateDoc(docRef, { ogImage: null });

      setOgImage(null);
      showToast("OG Website image deleted successfully!", "success");
    } catch (err) {
      console.error("Failed to delete OG Website image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ImageUploadCard
        title="OG Website Image"
        description="Upload Open Graph image for social media sharing"
        initialImage={ogImage?.url || undefined}
        onImageChange={handleImageChange}
        acceptedTypes="image/png,image/jpeg,image/webp"
        maxSize={5}
        className="w-full"
      />

      {(ogImage || isLoading) && (
        <div>
          <h4 className="text-sm font-medium mb-2">OG Website Image</h4>
          <div className="flex gap-4 flex-wrap">
            <div className="relative w-48 h-48">
              {isLoading ? (
                <div className="w-full h-full bg-background rounded-md border p-4 flex items-center justify-center">
                  <div className="animate-pulse">Loading...</div>
                </div>
              ) : (
                <img
                  src={ogImage.url}
                  alt="OG Website"
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
