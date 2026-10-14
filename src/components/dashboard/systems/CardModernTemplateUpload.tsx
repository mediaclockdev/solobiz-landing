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

export function CardmodernTemplateUpload() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [modernTemplate, setmodernTemplate] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const CARD_DOC_ID = "mainCard";

  // Fetch the existing modern template
  const fetchmodernTemplate = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setmodernTemplate(data.modernTemplate || null);
      } else {
        setmodernTemplate(null);
      }
    } catch (err) {
      console.error("Failed to fetch modern template:", err);
    }
  };

  useEffect(() => {
    fetchmodernTemplate();
  }, []);

  // Upload or replace modern template
  const handleImageChange = async (_: string[], file: File) => {
    if (!user) return;

    const storage = getStorage();
    try {
      setIsLoading(true);

      const newRef = ref(
        storage,
        `cardPreviews/modernTemplate/${Date.now()}_${file.name}`,
      );
      await uploadBytes(newRef, file);
      const url = await getDownloadURL(newRef);

      const newTemplate = {
        url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.uid,
      };

      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);

      // Delete old image if exists
      if (modernTemplate) {
        const pathStart = modernTemplate.url.indexOf("/o/") + 3;
        const pathEnd = modernTemplate.url.indexOf("?");
        const fullPath = decodeURIComponent(
          modernTemplate.url.substring(pathStart, pathEnd),
        );
        const oldRef = ref(storage, fullPath);
        await deleteObject(oldRef).catch(() => null);
      }

      // Update Firestore
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, { modernTemplate: newTemplate });
      } else {
        await setDoc(docRef, { modernTemplate: newTemplate });
      }

      setmodernTemplate(newTemplate);
      showToast("Modern template uploaded successfully!", "success");
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to upload modern template:", err);
      setIsLoading(false);
    }
  };

  // Delete modern template
  const handleDelete = async () => {
    if (!modernTemplate) return;

    try {
      setIsLoading(true);

      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);

      // Delete from storage
      const pathStart = modernTemplate.url.indexOf("/o/") + 3;
      const pathEnd = modernTemplate.url.indexOf("?");
      const fullPath = decodeURIComponent(
        modernTemplate.url.substring(pathStart, pathEnd),
      );
      const storage = getStorage();
      const imageRef = ref(storage, fullPath);
      await deleteObject(imageRef);

      // Remove from Firestore
      await updateDoc(docRef, { modernTemplate: null });

      setmodernTemplate(null);
      showToast("modern template deleted successfully!", "success");
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to delete modern template:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ImageUploadCard
        title="Modern Template Image"
        description="Upload a modern template image for business cards"
        initialImage={modernTemplate?.url || undefined}
        onImageChange={handleImageChange}
        acceptedTypes="image/png,image/jpeg,image/webp"
        maxSize={5}
        className="w-full"
      />

      {(modernTemplate || isLoading) && (
        <div>
          <h4 className="text-sm font-medium mb-2">Modern Template</h4>
          <div className="flex gap-4 flex-wrap">
            <div className="relative w-48 h-48">
              {isLoading ? (
                <div className="w-full h-full bg-background rounded-md border p-4 flex items-center justify-center">
                  <div className="animate-pulse">Loading...</div>
                </div>
              ) : (
                <img
                  src={modernTemplate.url}
                  alt="modern Template"
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
