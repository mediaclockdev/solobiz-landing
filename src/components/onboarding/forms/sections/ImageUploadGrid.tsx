"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { BusinessCard, FormComponentProps } from "@/types/businessCard";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Camera, Edit, Pencil, Trash2, XIcon, Upload, Sparkles, Lock } from "lucide-react";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ReactCrop, { Crop, convertToPixelCrop } from "react-image-crop";
import imageCompression from "browser-image-compression";
import "react-image-crop/dist/ReactCrop.css";
import { checkLocalCardExist } from "@/utils/cardStorage";
import { Plus, Minus, X } from "lucide-react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { applyBodyScrollLock } from "@/utils/scrollLock";
import { useSliderNav, SliderArrows } from "@/components/ui/slider-nav";

// ---------- Compression Helper (Updated for ~100KB output) ----------
async function compressImage(
  file: File,
  maxWidth: number,
  targetKB: number,
): Promise<File> {
  const targetMB = targetKB / 1024;

  const options = {
    maxSizeMB: targetMB,
    maxWidthOrHeight: maxWidth,
    useWebWorker: true,
    initialQuality: 0.95,
    alwaysKeepResolution: true,
  };

  try {
    let compressedFile = await imageCompression(file, options);

    // If still > target, try further manual compression
    while (compressedFile.size > targetKB * 1024) {
      const quality = Math.max(
        0.75,
        0.92 - compressedFile.size / (targetKB * 2048),
      );
      compressedFile = await imageCompression(compressedFile, {
        ...options,
        maxSizeMB: undefined,
        initialQuality: quality,
      });
      if (quality <= 0.5) break; // avoid over-degrading
    }

    return compressedFile;
  } catch (err) {
    console.error("Compression failed:", err);
    return file;
  }
}

// ---------- Crop Helper ----------
async function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop,
  fileName: string,
): Promise<File> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width!;
  canvas.height = crop.height!;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  ctx.drawImage(
    image,
    crop.x! * scaleX,
    crop.y! * scaleY,
    crop.width! * scaleX,
    crop.height! * scaleY,
    0,
    0,
    crop.width!,
    crop.height!,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject("Canvas is empty");
      resolve(new File([blob], fileName, { type: "image/jpeg" }));
    }, "image/png");
  });
}

// ---------- Upload Helper ----------
async function uploadImage(
  userId: string,
  imageType: "cover" | "profile" | "logo",
  file: File,
  existingUrl?: string,
  cardId?: string,
): Promise<string> {
  const storage = getStorage();

  if (existingUrl) {
    try {
      const pathStart = existingUrl.indexOf("/o/") + 3;
      const pathEnd = existingUrl.indexOf("?");
      const fullPath = decodeURIComponent(
        existingUrl.substring(pathStart, pathEnd),
      );
      const oldRef = ref(storage, fullPath);
      await deleteObject(oldRef);
    } catch (err) {
      console.warn("Failed to delete old image:", err);
    }
  }

  function getDaySuffix(day) {
    if (day >= 11 && day <= 13) return `${day}th`;
    switch (day % 10) {
      case 1:
        return `${day}st`;
      case 2:
        return `${day}nd`;
      case 3:
        return `${day}rd`;
      default:
        return `${day}th`;
    }
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString("en-US", { month: "long" });
  const day = getDaySuffix(now.getDate());

  const storageRef = ref(
    storage,
    `cards/${year}/${month}/${day}/${userId}/${cardId}/${imageType}_${Date.now()}.jpg`,
  );

  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// ---------- Remove Helper ----------
async function removeImage(
  userId: string | null,
  imageUrl: string,
  fieldName: "coverImage" | "profilePhoto" | "companyLogo",
  card: any,
  onUpdate: (updated: any) => void,
  resetInput: () => void,
  defaultProfile?: string,
) {
  try {
    const storage = getStorage();

    // Only delete from storage if it's not the default profile image
    const isDefaultProfile =
      fieldName === "profilePhoto" &&
      imageUrl === "/lovable-uploads/74b13cbe-0d2e-4997-8470-12fb69697b68.png";
    if (!isDefaultProfile && imageUrl && userId) {
      const pathStart = imageUrl.indexOf("/o/") + 3;
      const pathEnd = imageUrl.indexOf("?");
      const fullPath = decodeURIComponent(
        imageUrl.substring(pathStart, pathEnd),
      );
      const oldRef = ref(storage, fullPath);
      await deleteObject(oldRef);
    }

    let updatedCard = { ...card };
    if (fieldName === "profilePhoto") {
      updatedCard[fieldName] = defaultProfile || "";
    } else {
      updatedCard[fieldName] = "";
    }

    if (userId) {
      if (card.id) {
        await updateDoc(doc(db, "cards", card.id), updatedCard);
      }
    } else {
      // offline: save to localStorage
      localStorage.setItem(`card_${card.id}`, JSON.stringify(updatedCard));
    }

    resetInput();
    onUpdate(updatedCard);
  } catch (err) {
    console.error("Failed to remove image:", err);
  }
}

function CropModal({
  file,
  imageType,
  onClose,
  onComplete,
  card,
}: {
  file: File;
  imageType: "cover" | "profile" | "logo";
  onClose: () => void;
  onComplete: (croppedFile: File) => void;
  card: BusinessCard;
}) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // const { ASPECT_RATIO, FIXED_SIZE } = (() => {
  //   if (imageType === "cover") {
  //     return { ASPECT_RATIO: 16 / 9, FIXED_SIZE: null };
  //   }

  //   if (imageType === "profile") {
  //     return { ASPECT_RATIO: 3 / 4, FIXED_SIZE: null };
  //   }

  //   if (imageType === "logo") {
  //     return { ASPECT_RATIO: 1 / 1, FIXED_SIZE: null };
  //   }

  //   return { ASPECT_RATIO: 1 / 1, FIXED_SIZE: null };
  // })();

  const { ASPECT_RATIO, FIXED_SIZE } = (() => {
    if (card?.templateType === "modern") {
      if (imageType === "cover") {
        if (card.cardLayout === "centered" || card.cardLayout === "portrait") {
          return { ASPECT_RATIO: 460 / 380, FIXED_SIZE: { w: 460, h: 380 } };
        }

        if (card.cardLayout === "fadein") {
          return { ASPECT_RATIO: 500 / 380, FIXED_SIZE: { w: 500, h: 380 } };
        }

        // default modern cover
        return { ASPECT_RATIO: 460 / 190, FIXED_SIZE: { w: 460, h: 190 } };
      }

      if (imageType === "profile") {
        return { ASPECT_RATIO: 460 / 492, FIXED_SIZE: { w: 460, h: 492 } };
      }

      if (imageType === "logo") {
        return { ASPECT_RATIO: 50 / 50, FIXED_SIZE: { w: 50, h: 50 } };
      }

      return { ASPECT_RATIO: 1 / 1, FIXED_SIZE: null };
    } else {
      if (imageType === "cover") {
        return { ASPECT_RATIO: 448 / 270, FIXED_SIZE: { w: 448, h: 270 } };
      }

      if (imageType === "profile") {
        return { ASPECT_RATIO: 448 / 480, FIXED_SIZE: { w: 448, h: 480 } };
      }

      if (imageType === "logo") {
        return { ASPECT_RATIO: 80 / 60, FIXED_SIZE: { w: 80, h: 60 } };
      }

      return { ASPECT_RATIO: 1 / 1, FIXED_SIZE: null };
    }
  })();

  // ✅ Make sure imageSrc is loaded *before* rendering Cropper
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const createCroppedImage = async (): Promise<File> => {
    if (!croppedAreaPixels || !imageSrc) throw new Error("No crop area");

    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("No 2D context");

    const { x, y, width, height } = croppedAreaPixels;

    // If cover, force exact 448x270
    if (FIXED_SIZE) {
      canvas.width = FIXED_SIZE.w;
      canvas.height = FIXED_SIZE.h;
      ctx.drawImage(
        image,
        x,
        y,
        width,
        height,
        0,
        0,
        FIXED_SIZE.w,
        FIXED_SIZE.h,
      );
    } else {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
    }

    return new Promise((resolve) => {
      const isPng = file.type === "image/png"; // detect transparency support
      const mimeType = isPng ? "image/png" : "image/jpeg";
      const fileExt = isPng ? ".png" : ".jpg";

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(
              new File([blob], file.name.replace(/\.\w+$/, fileExt), {
                type: mimeType,
              }),
            );
          }
        },
        mimeType,
        1,
      );
    });
  };

  const handleDone = async () => {
    try {
      const cropped = await createCroppedImage();
      onComplete(cropped);
      onClose();
    } catch (err) {
      console.error("Cropping failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4 !mt-0">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[850px] max-w-full h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b dark:border-slate-800">
          <h2 className="text-lg font-semibold text-gray-800"></h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative flex-1 bg-gray-900">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop} // { x, y } for pan
              zoom={zoom} // Zoom level
              aspect={ASPECT_RATIO} // Keep your aspect ratio
              onCropChange={setCrop} // Update crop position
              onZoomChange={setZoom} // Update zoom
              onCropComplete={onCropComplete}
              cropShape="rect" // rectangle crop
              showGrid
              objectFit="contain" // important for zooming correctly
            />
          ) : (
            <div className="flex items-center justify-center text-white h-full">
              Loading image...
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Zoom Controls */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button onClick={() => setZoom((z) => Math.max(1, z - 0.2))}>
                <Minus className="text-gray-700 dark:text-gray-300" />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />

              <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>
                <Plus className="text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
              >
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageEditDialog({
  open,
  onOpenChange,
  isDisabled,
  card,
  storedOldImage,
  storedImage,
  onUpdate,
  resetInput,
  onEditClick,
  onEditCoverClick,
  onEditLogoClick,
}: {
  card: BusinessCard;
  open: boolean;
  isDisabled: boolean;
  storedOldImage: any;
  storedImage: any;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updated: any) => void;
  resetInput: (args?: any) => void;
  onEditClick: (args?: any) => void;
  onEditCoverClick: (args?: any) => void;
  onEditLogoClick: (args?: any) => void;
}) {
  const { user } = useAuth();
  // Remember the URL that failed rather than a boolean: a plain flag latched
  // on forever, so once the stale fallback 404'd the thumbnail stayed a
  // placeholder even after the user uploaded a good image.
  const [failedThumbUrl, setFailedThumbUrl] = useState<string | null>(null);
  useEffect(() => applyBodyScrollLock(open), [open]);
  // Thumbnail sources. An `undefined` src makes the browser draw a broken
  // image icon, so each thumbnail falls back to a placeholder instead.
  const rawProfileThumb =
    (card.profilePhoto && card.profilePhoto !== storedOldImage?.url
      ? card.profilePhoto
      : storedImage?.url) || undefined;
  const profileThumb =
    rawProfileThumb && rawProfileThumb !== failedThumbUrl
      ? rawProfileThumb
      : undefined;
  const thumbPlaceholder = (
    <div className="w-full h-full flex items-center justify-center">
      <Camera className="h-6 w-6 text-white/70" />
    </div>
  );

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => onOpenChange(false)}
        className={`!mt-0 fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 z-[100] ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Bottom Sheet */}
      <div
        className={`z-[100] fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
        bg-[#f8f9fb] dark:bg-transparent dark:border dark:border-slate-800 rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]
        transition-all duration-500 ease-in-out
        ${open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}
      >
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Images
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <XIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Profile Image */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[13px] font-bold text-slate-900 dark:text-white block px-1">
                  Profile Image
                </span>
                <div
                  className="w-20 h-20 relative rounded-lg overflow-hidden border-2 border-slate-50 shadow-inner"
                  style={{ background: "#8080805e" }}
                >
                  {profileThumb ? (
                    <img
                      src={profileThumb}
                      onError={() => setFailedThumbUrl(rawProfileThumb ?? null)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    thumbPlaceholder
                  )}
                </div>
              </div>
              {/* <Button className="w-full h-12 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-md shadow-md border-none flex items-center justify-center gap-2 group transition-transform active:scale-95">
                <Upload className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                Upload
              </Button> */}
              {/* {card.profilePhoto &&
                card.profilePhoto !==
                  "/lovable-uploads/74b13cbe-0d2e-4997-8470-12fb69697b68.png" && ( */}
              {(!card?.profilePhoto || card?.profilePhoto === "/lovable-uploads/74b13cbe-0d2e-4997-8470-12fb69697b68.png") ? (
                <Button
                  onClick={() => onEditClick()}
                  className={`w-full h-12 hover:bg-amber-500 text-white font-bold rounded-md shadow-md border-none flex items-center justify-center gap-2 group transition-transform active:scale-95`}
                  style={{ background: card?.brandColor }}
                >
                  <Upload className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                  Upload
                </Button>
              ) : (
              <div className="flex gap-3">
                <Button
                  onClick={() => onEditClick()}
                  className={`flex-1 h-12 hover:bg-amber-500 text-white font-bold rounded-md shadow-md border-none flex items-center justify-center gap-2 group transition-transform active:scale-95`}
                  style={{ background: card?.brandColor }}
                >
                  <Pencil className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                  Edit
                </Button>
                {!card?.profilePhoto ||
                  (card?.profilePhoto !== storedImage?.url && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        removeImage(
                          user?.uid ?? null,
                          card.profilePhoto,
                          "profilePhoto",
                          card,
                          onUpdate,
                          () => resetInput("profile"),
                          storedImage?.url,
                        )
                      }
                      className={`flex-1 h-12 border-slate-100 bg-slate-50/50 text-slate-900 font-bold rounded-md hover:bg-slate-100 flex items-center justify-center gap-2 transition-transform active:scale-95`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  ))}
              </div>
              )}
              {/* )}  */}
            </div>

            {/* Banner Image */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[13px] font-bold text-slate-900">
                  Banner Image
                </span>
                <div
                  className="w-20 h-20 relative rounded-lg overflow-hidden border-2 border-slate-50 shadow-inner"
                  style={{ background: "#8080805e" }}
                >
                  {card.coverImage ? (
                    <img
                      src={card.coverImage}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    thumbPlaceholder
                  )}
                </div>
              </div>

              {!card?.coverImage ? (
                <Button
                  onClick={() => onEditCoverClick()}
                  disabled={isDisabled}
                  className={`w-full h-12 text-white font-bold rounded-md shadow-md border-none flex items-center justify-center gap-2 group transition-transform active:scale-95 ${
                    isDisabled
                      ? "opacity-60 cursor-not-allowed bg-slate-400 dark:bg-slate-700"
                      : "hover:bg-amber-500"
                  }`}
                  style={isDisabled ? undefined : { background: card?.brandColor }}
                >
                  {isDisabled ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Not available at this point
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                      Upload
                    </>
                  )}
                </Button>
              ) : (
              <div className="flex gap-3">
                <Button
                  onClick={() => onEditCoverClick()}
                  className={`flex-1 h-12 bg-amber-400 hover:bg-amber-500 text-white font-black rounded-md shadow-md border-none flex items-center justify-center gap-2 group transition-transform active:scale-95 ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted/80"
                  }`}
                  style={{ background: card?.brandColor }}
                >
                  <Pencil className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                  Edit
                </Button>

                <Button
                  onClick={() =>
                    removeImage(
                      user?.uid ?? null,
                      card.coverImage,
                      "coverImage",
                      card,
                      onUpdate,
                      () => resetInput("cover"),
                      storedImage?.url,
                    )
                  }
                  variant="outline"
                  className={`flex-1 h-12 border-slate-100 bg-slate-50/50 text-slate-900 font-black rounded-md hover:bg-slate-100 flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted/80"
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
              )}
            </div>

            {/* Profile Logo */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between px-1">
                {/* <div className="flex items-center"> */}
                <span className="text-[13px] font-bold text-slate-900">
                  Company Logo
                </span>
                <div
                  className="w-20 h-20 relative rounded-lg overflow-hidden border-2 border-slate-50 shadow-inner"
                  style={{ background: "#8080805e" }}
                >
                  {card.companyLogo ? (
                    <img
                      src={card.companyLogo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    thumbPlaceholder
                  )}
                  {/* </div> */}
                  {/* <Lock className="h-3 w-3 text-slate-300" /> */}
                </div>

                {/* <div className="flex items-center gap-1 text-indigo-500 text-[10px] font-black uppercase tracking-wider">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Plus className="h-3 w-3 text-indigo-500 stroke-[3px]" />
                  </div>
                  Plus
                </div> */}
              </div>
              {/* 
              <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100 border-none transition-transform active:scale-95">
                Upgrade to add logo
              </Button> */}
              {!card?.companyLogo ? (
                <Button
                  onClick={() => onEditLogoClick()}
                  disabled={isDisabled}
                  className={`w-full h-12 text-white font-bold rounded-md shadow-md border-none flex items-center justify-center gap-2 group transition-transform active:scale-95 ${
                    isDisabled
                      ? "opacity-60 cursor-not-allowed bg-slate-400 dark:bg-slate-700"
                      : "hover:bg-amber-500"
                  }`}
                  style={isDisabled ? undefined : { background: card?.brandColor }}
                >
                  {isDisabled ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Not available at this point
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                      Upload
                    </>
                  )}
                </Button>
              ) : (
              <div className="flex gap-3">
                <Button
                  onClick={() => onEditLogoClick()}
                  className={`flex-1 h-12 bg-amber-400 hover:bg-amber-500 text-white font-black rounded-md shadow-md border-none flex items-center justify-center gap-2 group transition-transform active:scale-95 ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted/80"
                  }`}
                  style={{ background: card?.brandColor }}
                >
                  <Pencil className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                  Edit
                </Button>

                <Button
                  onClick={() =>
                    removeImage(
                      user?.uid ?? null,
                      card.companyLogo,
                      "companyLogo",
                      card,
                      onUpdate,
                      () => resetInput("logo"),
                      storedImage?.url,
                    )
                  }
                  variant="outline"
                  className={`flex-1 h-12 border-slate-100 bg-slate-50/50 text-slate-900 font-black rounded-md hover:bg-slate-100 flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted/80"
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
              )}
            </div>

            {/* Upgrade to Pro - the image uploads above, logo included, stay free */}
            <a
              href="/pricing"
              className="flex items-center justify-center gap-2 w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-md shadow-lg shadow-indigo-100 dark:shadow-indigo-900 transition-transform active:scale-95 mt-2"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------- Main Component ----------
export function ImageUploadGrid({
  card,
  onUpdate,
  isEditMode,
}: FormComponentProps) {
  const { user } = useAuth();
  const isDisabled = !isEditMode;
  const { showToast } = useToast();

  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<"cover" | "profile" | "logo" | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCoverLoading, setIsCoverLoading] = useState(false);
  const [isLogoLoading, setIsLogoLoading] = useState(false);
  const [showImageEditDialog, setShowImageEditDialog] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const imageNav = useSliderNav(3, currentSlide, setCurrentSlide);
  // The stored profile URL can 404 (file removed from storage). Fall back to
  // the same "no image" placeholder the other slides use.
  const [failedSlideUrl, setFailedSlideUrl] = useState<string | null>(null);


  useEffect(() => {
    const handleOpenImageEdit = () => setShowImageEditDialog(true);
    window.addEventListener("open-image-edit-dialog", handleOpenImageEdit);
    return () => window.removeEventListener("open-image-edit-dialog", handleOpenImageEdit);
  }, []);

  const fileInputRefs = {
    cover: useRef<HTMLInputElement | null>(null),
    profile: useRef<HTMLInputElement | null>(null),
    logo: useRef<HTMLInputElement | null>(null),
  };

  const fieldMap = {
    cover: "coverImage",
    profile: "profilePhoto",
    logo: "companyLogo",
  } as const;

  const onEditClick = () => {
    setShowImageEditDialog(false);
    fileInputRefs.profile.current?.click();
  };

  const onEditCoverClick = () => {
    setShowImageEditDialog(false);
    fileInputRefs.cover.current?.click();
  };

  const onEditLogoClick = () => {
    setShowImageEditDialog(false);
    fileInputRefs.logo.current?.click();
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "profile" | "logo",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024)
        return showToast("File must be under 5MB.", "error");
      setCropFile(file);
      setCropType(type);
      e.target.value = "";
    }
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ---------------------------------------------------------------------
  // ✅ EXISTING handleCropComplete (KEEP ALL OTHER CODE SAME)
  // ---------------------------------------------------------------------
  const handleCropComplete = async (croppedFile: File) => {
    if (!cropType) return;
    const fieldName = fieldMap[cropType];
    const oldUrl = card[fieldName] as string | undefined;

    let maxWidth = 1280;
    let quality = 0.95;

    if (cropType === "profile") {
      setIsLoading(true);
      maxWidth = 600;
      quality = 0.95; // ~100KB
    } else if (cropType === "logo") {
      setIsLogoLoading(true);
      maxWidth = 300;
      quality = 0.95; // ~25KB
    } else if (cropType === "cover") {
      setIsCoverLoading(true);
      maxWidth = 1280;
      quality = 0.95; // ~100KB
    }

    let compressedFile: File;

    if (cropType === "profile") {
      compressedFile = await compressImage(croppedFile, 600, 200); // 100KB target
    } else if (cropType === "cover") {
      compressedFile = await compressImage(croppedFile, 1280, 200); // 100KB target
    } else if (cropType === "logo") {
      compressedFile = await compressImage(croppedFile, 300, 80); // ~40KB target
    } else {
      compressedFile = croppedFile;
    }

    let url = "";

    if (user?.uid) {
      url = await uploadImage(
        user.uid,
        cropType,
        compressedFile,
        oldUrl === storedImage?.url ? null : oldUrl,
        card.urlName,
      );
      const updatedCard = { ...card, [fieldName]: url };
      if (card.id) await updateDoc(doc(db, "cards", card.id), updatedCard);
      onUpdate(updatedCard);
    } else {
      url = await fileToDataURL(compressedFile);
      const updatedCard = { ...card, [fieldName]: url };
      onUpdate(updatedCard);
      localStorage.setItem(`card_${card.id}`, JSON.stringify(updatedCard));
    }

    setIsLoading(false);
    setIsLogoLoading(false);
    setIsCoverLoading(false);
  };

  const resetInput = (type: "cover" | "profile" | "logo") => {
    const ref = fileInputRefs[type].current;
    if (ref) ref.value = "";
  };

  const [storedImage, setStoredImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  const [storedOldImage, setStoredOldImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);

  const rawProfileUrl =
    (card.profilePhoto && card.profilePhoto !== storedOldImage?.url
      ? card.profilePhoto
      : storedImage?.url) || undefined;
  const slideProfileUrl =
    rawProfileUrl && rawProfileUrl !== failedSlideUrl ? rawProfileUrl : undefined;

  const CARD_DOC_ID = "mainCard";

  const fetchImage = async () => {
    try {
      const localCard = localStorage.getItem(`card_${CARD_DOC_ID}`);
      if (localCard) {
        onUpdate(JSON.parse(localCard));
        setStoredImage(JSON.parse(localCard));
      } else {
        const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.backupCard) {
            setStoredImage(data.backupCard);
            if (data.oldUrl) {
              setStoredOldImage(data.oldUrl);
            }
          } else {
            setStoredImage(null);
          }
        } else {
          setStoredImage(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch image:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchImage();
  }, []);

  return (
    <TooltipProvider>
      {cropFile && cropType && (
        <CropModal
          card={card}
          file={cropFile}
          imageType={cropType}
          onClose={() => {
            setCropFile(null);
            setCropType(null);
          }}
          onComplete={handleCropComplete}
        />
      )}

      <div className="mt-6 hidden">
        <Label className="text-sm font-medium text-foreground">
          Add Images{" "}
          {!isEditMode && (
            <span className="italic font-normal">
              [Profile Image upload only]
            </span>
          )}
        </Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 hidden">
        {/* Cover */}
        <div className="space-y-2 relative">
          <Label className="text-sm text-muted-foreground">Upload Cover</Label>
          <div
            className={`w-full h-24 bg-muted border border-border rounded-lg flex items-center justify-center relative ${
              isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/80"
            }`}
          >
            {isCoverLoading ? (
              <div className="animate-pulse">Loading...</div>
            ) : (
              card.coverImage && (
                <img
                  src={card.coverImage}
                  alt="Cover"
                  className="w-full h-full rounded-lg object-cover"
                />
              )
            )}
            <label
              className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer ${
                isDisabled ? "pointer-events-none" : ""
              }`}
            >
              {!card.coverImage && (
                <>
                  <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Add Cover
                  </span>
                </>
              )}
              <input
                ref={fileInputRefs.cover}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isDisabled}
                onChange={(e) => handleFileSelect(e, "cover")}
              />
            </label>

            {!isDisabled && card.coverImage && (
              <div className="absolute top-2 right-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRefs.cover.current?.click()}
                  className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Edit size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    removeImage(
                      user?.uid ?? null,
                      card.coverImage,
                      "coverImage",
                      card,
                      onUpdate,
                      () => resetInput("cover"),
                      storedImage?.url,
                    )
                  }
                  className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Upload Profile
          </Label>
          <label className="cursor-pointer block">
            <div className="w-full h-24 flex justify-center relative">
              <div className="w-24 h-24 rounded-full bg-muted border border-border flex flex-col items-center justify-center hover:bg-muted/80 transition-colors overflow-hidden relative">
                {isLoading ? (
                  <div className="animate-pulse object-cover">Loading...</div>
                ) : (
                  <img
                    src={
                      (card.profilePhoto == storedOldImage?.url
                        ? storedImage?.url
                        : card.profilePhoto &&
                            card.profilePhoto != storedOldImage?.url
                          ? card.profilePhoto
                          : storedImage?.url) || undefined
                    }
                    className="w-full h-full rounded-full object-cover"
                  />
                )}
                {card.profilePhoto &&
                  card.profilePhoto !==
                    "/lovable-uploads/74b13cbe-0d2e-4997-8470-12fb69697b68.png" && (
                    <div className="absolute top-2 right-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.profile.current?.click()}
                        className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <Edit size={14} />
                      </button>
                      {card?.profilePhoto !== storedImage?.url && (
                        <button
                          type="button"
                          onClick={() =>
                            removeImage(
                              user?.uid ?? null,
                              card.profilePhoto,
                              "profilePhoto",
                              card,
                              onUpdate,
                              () => resetInput("profile"),
                              storedImage?.url,
                            )
                          }
                          className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}

                {!card.profilePhoto && !isLoading && (
                  <div className="flex flex-col items-center justify-center absolute inset-0">
                    <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Add Photo
                    </span>
                  </div>
                )}
              </div>
            </div>
            <input
              ref={fileInputRefs.profile}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, "profile")}
            />
          </label>
        </div>

        {/* Logo */}
        <div className="space-y-2 relative">
          <Label className="text-sm text-muted-foreground">Upload Logo</Label>
          <div
            className={`w-full h-24 bg-muted border border-border rounded-lg flex items-center justify-center relative ${
              isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/80"
            }`}
          >
            {isLogoLoading ? (
              <div className="animate-pulse">Loading...</div>
            ) : (
              card.companyLogo && (
                <img
                  src={card.companyLogo}
                  alt="Logo"
                  className="w-full h-full rounded-lg object-cover"
                />
              )
            )}

            <label
              className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer ${
                isDisabled ? "pointer-events-none" : ""
              }`}
            >
              {!card.companyLogo && (
                <>
                  <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Add Logo
                  </span>
                </>
              )}
              <input
                ref={fileInputRefs.logo}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isDisabled}
                onChange={(e) => handleFileSelect(e, "logo")}
              />
            </label>

            {!isDisabled && card.companyLogo && (
              <div className="absolute top-2 right-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRefs.logo.current?.click()}
                  className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Edit size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    removeImage(
                      user?.uid ?? null,
                      card.companyLogo,
                      "companyLogo",
                      card,
                      onUpdate,
                      () => resetInput("logo"),
                      storedImage?.url,
                    )
                  }
                  className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center hidden">
        Click to add/change images (JPG, PNG, WEBP, max. 5MB)
      </p>

      {/* Slider height follows the column it sits in, not the screen. On
          sm:/lg: a 1024px viewport forced 480px of height into a ~393px
          dashboard column. */}
      <div className="relative mb-14 [container-type:inline-size]">
        <div
          className="h-[340px] [@container(min-width:420px)]:h-[420px] [@container(min-width:640px)]:h-[480px] relative rounded-lg overflow-hidden border-2 shadow-sm outline-none"
          style={{
            border: `1px solid ${card.brandColor}`,
            backgroundColor: `${card.brandColor}80` || "#4299e1",
          }}
          aria-label="Card images"
          {...imageNav.handlers}
        >
          <SliderArrows
            onPrev={imageNav.goPrev}
            onNext={imageNav.goNext}
            canPrev={imageNav.canPrev}
            canNext={imageNav.canNext}
            label="image"
          />
          {isLoading ? (
            <div className="w-full h-full relative overflow-hidden rounded-md bg-gray-300">
              <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
          ) : (
            <div className="w-full h-full relative flex items-center justify-center">
              {currentSlide === 0 && (
                slideProfileUrl ? (
                  <img
                    src={slideProfileUrl}
                    alt="Profile"
                    onError={() => setFailedSlideUrl(rawProfileUrl ?? null)}
                    className="w-full h-full object-cover animate-in fade-in zoom-in duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center text-white/80 animate-in fade-in zoom-in duration-300">
                    <Camera className="h-10 w-10 mb-2" />
                    <span>No Profile Image</span>
                  </div>
                )
              )}
              {currentSlide === 1 && (
                card.coverImage ? (
                  <img
                    src={card.coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover animate-in fade-in zoom-in duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center text-center px-4 text-white/80 animate-in fade-in zoom-in duration-300">
                    <Camera className="h-10 w-10 mb-2" />
                    <span className="font-semibold text-sm">No Cover Image</span>
                    {isDisabled && (
                      <span className="text-xs text-white/75 mt-1 font-medium">
                        Not available at this point
                      </span>
                    )}
                  </div>
                )
              )}
              {currentSlide === 2 && (
                card.companyLogo ? (
                  <img
                    src={card.companyLogo}
                    alt="Logo"
                    className="w-full h-full object-contain p-8 animate-in fade-in zoom-in duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center text-center px-4 text-white/80 animate-in fade-in zoom-in duration-300">
                    <Camera className="h-10 w-10 mb-2" />
                    <span className="font-semibold text-sm">No Company Logo</span>
                    {isDisabled && (
                      <span className="text-xs text-white/75 mt-1 font-medium">
                        Not available at this point
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-3 right-3 bg-white rounded-full h-10 px-5 text-xs font-bold shadow-lg border-2 border-slate-100 z-20 transition-transform active:scale-95 text-slate-900"
            onClick={() => setShowImageEditDialog(true)}
          >
            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
          </Button>
        </div>

        {/* Slider Dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx 
                  ? "w-6 bg-indigo-600" 
                  : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* <div className="absolute bottom-0 left-6 translate-y-[10%] z-10">
          <div className="w-28 h-28 rounded-full border-2 border-indigo-500 shadow-xl p-0.5 bg-white overflow-hidden relative">
            <div className="w-full h-full relative rounded-full overflow-hidden">
              <Image
                src={"https://picsum.photos/seed/rob/200/200"}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div> */}
        <input
          ref={fileInputRefs.cover}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isDisabled}
          onChange={(e) => handleFileSelect(e, "cover")}
        />
        <input
          ref={fileInputRefs.logo}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isDisabled}
          onChange={(e) => handleFileSelect(e, "logo")}
        />
        <input
          ref={fileInputRefs.profile}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileSelect(e, "profile")}
        />
      </div>

      <ImageEditDialog
        onEditClick={onEditClick}
        onEditCoverClick={onEditCoverClick}
        onEditLogoClick={onEditLogoClick}
        resetInput={resetInput}
        onUpdate={onUpdate}
        storedOldImage={storedOldImage}
        storedImage={storedImage}
        card={card}
        isDisabled={isDisabled}
        open={showImageEditDialog}
        onOpenChange={setShowImageEditDialog}
      />
    </TooltipProvider>
  );
}
