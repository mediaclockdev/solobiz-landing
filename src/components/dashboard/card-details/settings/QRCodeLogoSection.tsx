"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X } from "lucide-react";
import { BusinessCard } from "@/types/businessCard";
import { generateQRCodeWithLogo } from "@/utils/qrCodeGenerator";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
  onSnapshot,
  DocumentReference,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface QRCodeLogoSectionProps {
  card: BusinessCard;
  onLogoChange?: (logoFile: File | null) => void;
  qrCodeUrl?: string;
  onQRCodeUpdate?: (newQRCodeUrl: string) => void;
}

export function QRCodeLogoSection({
  card,
  onLogoChange,
  qrCodeUrl = "",
  onQRCodeUpdate,
}: QRCodeLogoSectionProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");

  const [savedQRCodeUrl, setSavedQRCodeUrl] = useState<string>(
    card.qrCode?.qrCodeUrl || ""
  );
  const [qrCodePreview, setQRCodePreview] = useState<string>("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [colorSource, setColorSource] = useState<"brand" | "custom">(
    card.qrCode?.colorSource ?? "brand"
  );
  const [customColor, setCustomColor] = useState<string>(
    card.qrCode?.selectedColor ?? "#000000"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();

  const [docRef, setDocRef] = useState<DocumentReference | null>(null);

  const selectedColor = colorSource === "brand" ? card.brandColor : customColor;

  // ---------- Generate QR for preview ----------
  const generatePreviewQRCode = useCallback(async () => {
    setIsGenerating(true);
    try {
      if (typeof window !== "undefined") {
        const cardUrl = `${window.location.origin}/${card.urlName}`;
        let defaultLogo=logoFile;
        if(logoFile===null){
            const response = await fetch("/lovable-uploads/6e79eba6-9505-44d3-9af1-e8b13b7c46d0.png");
            const blob = await response.blob();
              defaultLogo = new File([blob], "logo.png", { type: blob.type });    
        }
        const qrDataUrl = await generateQRCodeWithLogo(cardUrl, defaultLogo, {
          width: 200,
          margin: 2,
          color: { dark: selectedColor, light: "#FFFFFF" },
        });
        setQRCodePreview(qrDataUrl);
      }
    } catch (error) {
      console.error("Failed to generate QR preview:", error);
      showToast("Failed to generate QR preview", "error");
    } finally {
      setIsGenerating(false);
    }
  }, [card.metadata.id, logoFile, selectedColor, showToast]);

  // ---------- Logo Upload ----------
  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setIsProcessing(true);

    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    const previewUrl = URL.createObjectURL(file);

    setLogoFile(file);
    setLogoPreviewUrl(previewUrl);
    onLogoChange?.(file);

    setIsProcessing(false);
  };

  const handleRemoveLogo = async () => {
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoFile(null);
    setLogoPreviewUrl("");
    onLogoChange?.(null);
  };

  // ---------- Color change ----------
  const handleColorChange = async (
    source: "brand" | "custom",
    color?: string
  ) => {
    setColorSource(source);
    if (source === "custom" && color) setCustomColor(color);
    await generatePreviewQRCode();
  };

  // ---------- Save QR to Firebase ----------
  const handleSave = async () => {
    if (!user) return showToast("User not logged in", "error");
    if (!qrCodePreview) return showToast("No preview to save", "error");
    if (!docRef) return showToast("No document reference found", "error");

    try {
      setIsSaving(true);

      const res = await fetch(qrCodePreview);
      const qrBlob = await res.blob();
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
  const year = now.getFullYear(); // 2025
  const month = now.toLocaleString("en-US", { month: "long" }); // Nov
  const day = getDaySuffix(now.getDate());


      const storage = getStorage();
      const qrRef = ref(
        storage,
        `cards/${year}/${month}/${day}/${user.uid}/${card.id}/QRCode/qr_${card.metadata.id}.png`
      );

      await uploadBytes(qrRef, qrBlob);
      const qrDownloadUrl = await getDownloadURL(qrRef);

      const updatedCard = {
        ...card,
        qrCode: {
          colorSource,
          selectedColor,
          qrCodeUrl: qrDownloadUrl,
          qrLogoUrl: logoPreviewUrl || "",
          targetUrl: `${window.location.origin}/${card.urlName}`,
        },
      };

      await updateDoc(docRef, updatedCard);
      // update immediately in UI
      setSavedQRCodeUrl(qrDownloadUrl);
      onQRCodeUpdate(qrDownloadUrl);
      setQRCodePreview("");

      showToast("QR Code saved!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save QR Code", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- Fetch docRef + Listen ----------
  useEffect(() => {
    if (!card?.metadata?.id) return;

    const q = query(
      collection(db, "cards"),
      where("metadata.id", "==", card.metadata.id)
    );

    let unsubscribe: (() => void) | undefined;

    getDocs(q).then((snapshot) => {
      if (!snapshot.empty) {
        const ref = snapshot.docs[0].ref;
        setDocRef(ref);

        unsubscribe = onSnapshot(ref, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as BusinessCard;
            //console.log("Data====>",data.qrCode);
            if (data.qrCode?.qrCodeUrl) {
              setSavedQRCodeUrl(data.qrCode.qrCodeUrl);
            }
            if (data.qrCode?.colorSource) {
              setColorSource(data.qrCode.colorSource);
            }
            if (data.qrCode?.selectedColor) {
              setCustomColor(data.qrCode.selectedColor);
            }
          }
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [card.metadata.id]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [logoPreviewUrl]);

  // Auto-generate QR preview when logo or color changes
  useEffect(() => {
    if (!card?.metadata?.id) return;
    if (logoFile || colorSource === "custom" || colorSource === "brand") {
      generatePreviewQRCode();
    }
  }, [
    logoFile,
    selectedColor,
    card.metadata.id,
    colorSource,
    generatePreviewQRCode,
  ]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">QR Code Logo</h3>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Choose Color:</Label>
            <RadioGroup
              value={colorSource}
              onValueChange={(v: "brand" | "custom") => handleColorChange(v)}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="brand" id="brand" />
                <Label htmlFor="brand" className="cursor-pointer">
                  Brand Color
                </Label>
                <div
                  className="w-8 h-8 rounded border-2 border-border"
                  style={{ backgroundColor: card.brandColor }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="cursor-pointer">
                  Custom Color
                </Label>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleColorChange("custom", e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                  disabled={colorSource !== "custom"}
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => handleColorChange("custom", e.target.value)}
                  className="w-24 font-mono text-sm"
                  placeholder="#000000"
                  disabled={colorSource !== "custom"}
                />
              </div>
            </RadioGroup>
          </div>

          {/* Logo Upload & QR */}
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 border border-dashed border-muted-foreground rounded-lg flex items-center justify-center bg-muted/20 overflow-hidden">
                {logoPreviewUrl ? (
                  <>
                    <img
                      src={logoPreviewUrl}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/90"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {isProcessing ? "..." : "Logo"}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="logo-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("logo-upload")?.click()
                  }
                  disabled={isProcessing}
                >
                  {logoPreviewUrl ? "Change Logo" : "Upload Logo"}
                </Button>
              </div>
            </div>

            {/* QR Codes */}
            <div className="flex flex-wrap gap-4 sm:gap-6">
              {savedQRCodeUrl && (
                <div>
                  <Label className="block mb-1 text-xs">Saved QR</Label>
                  <img
                    src={savedQRCodeUrl}
                    alt="Saved QR Code"
                    className="w-32 h-32 border border-border rounded-lg"
                  />
                </div>
              )}

              {qrCodePreview && (
                <div className="relative">
                  <Label className="block mb-1 text-xs">Preview QR</Label>
                  <img
                    src={qrCodePreview}
                    alt="Preview QR Code"
                    className="w-32 h-32 border border-border rounded-lg"
                  />
                  {isGenerating && (
                    <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        Updating...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-24"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
