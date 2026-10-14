"use client";
import React, { useEffect, useState } from "react";
import { ImageUploadCard } from "./ImageUploadCard";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { X } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

type SliderImage = {
  url: string;
  uploadedAt: string;
  uploadedBy: string;
};

export function SliderImagesUpload() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [images, setImages] = useState<SliderImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const CARD_DOC_ID = "mainCard";

  // Fetch stored slider images from Firestore
  const fetchSliderImages = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setImages(data.sliderImages || []);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.error("Failed to fetch slider images:", err);
    }
  };

  useEffect(() => {
    fetchSliderImages();
  }, []);

  // Upload multiple images
  const handleImagesChange = async (_: string[], files: File[]) => {
    if (!user || files.length === 0) return;
    const storage = getStorage();

    try {
      setIsLoading(true);
      const newImages: SliderImage[] = [];

      for (const file of files) {
        const newRef = ref(
          storage,
          `cardPreviews/slider/${Date.now()}_${file.name}`
        );
        await uploadBytes(newRef, file);
        const url = await getDownloadURL(newRef);

        newImages.push({
          url,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.uid,
        });
      }

      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);

      let updatedImages: SliderImage[] = [];
      if (docSnap.exists()) {
        const data = docSnap.data();
        updatedImages = [...(data.sliderImages || []), ...newImages];
        await updateDoc(docRef, { sliderImages: updatedImages });
      } else {
        updatedImages = [...newImages];
        await setDoc(docRef, { sliderImages: updatedImages });
      }

      setImages(updatedImages);
      showToast("Slider images uploaded successfully!", "success");
    } catch (err) {
      console.error("Failed to upload slider images:", err);
      showToast("Failed to upload images", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a specific image
  const handleDelete = async (url: string) => {
    try {
      setIsLoading(true);

      // Delete from Firebase Storage
      const pathStart = url.indexOf("/o/") + 3;
      const pathEnd = url.indexOf("?");
      const fullPath = decodeURIComponent(url.substring(pathStart, pathEnd));
      const storage = getStorage();
      const imageRef = ref(storage, fullPath);
      await deleteObject(imageRef);

      // Update Firestore
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const updatedImages = images.filter((img) => img.url !== url);
      await updateDoc(docRef, { sliderImages: updatedImages });

      setImages(updatedImages);
      showToast("Slider image deleted successfully!", "success");
    } catch (err) {
      console.error("Failed to delete slider image:", err);
      showToast("Failed to delete image", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ImageUploadCard
        title="Slider Images"
        description="Upload multiple images for carousel/slider display"
        multiple={true}
        onMultipleImageChange={handleImagesChange}
        acceptedTypes="image/png,image/jpeg,image/webp"
        maxSize={5}
        className="w-full"
      />

      {/* Preview Stored Slider Images */}
      {(images.length > 0 || isLoading) && (
        <div>
          <h4 className="text-sm font-medium mb-2">Slider Images</h4>
          <div className="flex gap-4 flex-wrap">
            {isLoading && (
              <div className="w-48 h-48 flex items-center justify-center border rounded">
                <div className="animate-pulse">Loading...</div>
              </div>
            )}

            {images.map((img) => (
              <div key={img.url} className="relative w-24 h-24">
                <img
                  src={img.url}
                  alt="Slider"
                  className="w-full h-full rounded-md border object-cover"
                  onError={(e) => {
                    // Hide broken image if URL is invalid
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <button
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded"
                  onClick={() => handleDelete(img.url)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
