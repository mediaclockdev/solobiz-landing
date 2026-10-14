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

export function CardClassicTemplateUpload() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [classicTemplate, setClassicTemplate] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const CARD_DOC_ID = "mainCard";

  const fetchClassicTemplate = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setClassicTemplate(data.classicTemplate || null);
      } else {
        setClassicTemplate(null);
      }
    } catch (err) {
      console.error("Failed to fetch classic template:", err);
    }
  };

  useEffect(() => {
    fetchClassicTemplate();
  }, []);

  const handleImageChange = async (_: string[], file: File) => {
    if (!user) return;

    const storage = getStorage();

    try {
      setIsLoading(true);
      // Upload new classic template image
      const newRef = ref(
        storage,
        `cardPreviews/classicTemplate/${Date.now()}_${file.name}`
      );
      await uploadBytes(newRef, file);
      const url = await getDownloadURL(newRef);

      const newClassicTemplate = {
        url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.uid,
      };

      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);

      // Delete old image from storage if exists
      if (classicTemplate) {
        const pathStart = classicTemplate.url.indexOf("/o/") + 3;
        const pathEnd = classicTemplate.url.indexOf("?");
        const fullPath = decodeURIComponent(
          classicTemplate.url.substring(pathStart, pathEnd)
        );
        const oldRef = ref(storage, fullPath);
        await deleteObject(oldRef).catch(() => null);
      }

      // Update Firestore
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, { classicTemplate: newClassicTemplate });
      } else {
        await setDoc(docRef, { classicTemplate: newClassicTemplate });
      }

      setClassicTemplate(newClassicTemplate);
      showToast("Classic template uploaded successfully!", "success");
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to upload classic template:", err);
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!classicTemplate) return;

    try {
      setIsLoading(true);

      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);

      // Delete from storage
      const pathStart = classicTemplate.url.indexOf("/o/") + 3;
      const pathEnd = classicTemplate.url.indexOf("?");
      const fullPath = decodeURIComponent(
        classicTemplate.url.substring(pathStart, pathEnd)
      );
      const storage = getStorage();
      const imageRef = ref(storage, fullPath);
      await deleteObject(imageRef);

      // Remove from Firestore
      await updateDoc(docRef, { classicTemplate: null });

      setClassicTemplate(null);
      showToast("Classic template deleted successfully!", "success");
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to delete classic template:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ImageUploadCard
        title="Classic Template Image"
        description="Upload a classic template image for business cards"
        initialImage={classicTemplate?.url || undefined}
        onImageChange={handleImageChange}
        acceptedTypes="image/png,image/jpeg,image/webp"
        maxSize={5}
        className="w-full"
      />

      {(classicTemplate || isLoading) && (
        <div>
          <h4 className="text-sm font-medium mb-2">Classic Template</h4>
          <div className="flex gap-4 flex-wrap">
            <div className="relative w-48 h-48">
              {isLoading ? (
                <div className="w-full h-full bg-background rounded-md border p-4 flex items-center justify-center">
                  <div className="animate-pulse">Loading...</div>
                </div>
              ) : (
                <img
                  src={classicTemplate.url}
                  alt="Classic Template"
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
