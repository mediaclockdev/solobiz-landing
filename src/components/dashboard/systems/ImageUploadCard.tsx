"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageUploadCardProps = {
  title: string;
  description?: string;
  onImageChange?: (images: string[], files: File) => void;
  onMultipleImageChange?: (images: string[], files: File[]) => void;
  acceptedTypes?: string;
  maxSize?: number;
  className?: string;
  initialImage?: string;
  multiple?: boolean;
};

export function ImageUploadCard({
  title,
  description,
  acceptedTypes = "image/*",
  maxSize = 5,
  className,
  initialImage,
  multiple = false,
  onImageChange,
  onMultipleImageChange,
}: ImageUploadCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Validate and process
    const validFiles: File[] = [];
    const imageUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`"${file.name}" is too large (max ${maxSize}MB)`);
        continue;
      }
      validFiles.push(file);
      imageUrls.push(URL.createObjectURL(file));
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
 if(onMultipleImageChange){
    onMultipleImageChange?.(imageUrls, validFiles);
 }else{

   onImageChange?.(imageUrls, validFiles[0]);
 }
    setIsUploading(false);

    // Reset input so same file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className={cn("card-hover animate-fade-in", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground border-b pb-2">
          {title}
        </CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 cursor-pointer hover:border-primary/50 hover:bg-muted/50",
            isUploading && "pointer-events-none opacity-50"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm">
                {multiple ? "Click to upload images" : "Click to upload image"}
              </p>
            </div>
          )}
        </div>
        <input
          id="image-upload-input"
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          className="hidden"
          accept={acceptedTypes}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </CardContent>
    </Card>
  );
}
