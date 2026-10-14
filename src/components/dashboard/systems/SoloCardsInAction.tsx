"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { db } from "@/services/firebase";
import { useToast } from "@/contexts/ToastContext";
import { doc, getDoc, setDoc } from "firebase/firestore";

export function SoloCardsInAction() {
  // State for video settings
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const { showToast } = useToast();

  // Firestore document reference
  const settingsRef = doc(db, "settings", "SoloCardsVideo");

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title || "");
          setSubtitle(data.subtitle || "");
          setVideoLink(data.videoLink || "");
        }
      } catch (error) {
        console.error("Error fetching video settings:", error);
        showToast("Failed to fetch video settings.", "error");
      }
    };

    fetchSettings();
  }, []);

  // Save settings to Firestore
  const handleSave = async () => {
    try {
      await setDoc(settingsRef, {
        title,
        subtitle,
        videoLink,
      });

      showToast("SoloCards Action Settings Saved", "success");
    } catch (error) {
      console.error("Error saving video settings:", error);
      showToast("Failed to save video settings", "error");
    }
  };

  return (
    <Card className="lg:col-span-2 card-hover">
      <CardHeader>
        <CardTitle className="text-lg">See SoloCards in Action</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure the video displayed on the landing page
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Title</span>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-8 text-xs ml-4"
                placeholder="Enter video title..."
              />
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Subtitle</span>
              <Input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full h-8 text-xs ml-4"
                placeholder="Enter video subtitle..."
              />
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Video Link</span>
              <Input
                type="text"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                className="w-full h-8 text-xs ml-4"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <Button onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
