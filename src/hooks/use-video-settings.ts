"use client";
import { useState, useEffect } from 'react';

interface VideoSettings {
  title: string;
  subtitle: string;
  videoLink: string;
}

const defaultSettings: VideoSettings = {
  title: "See SoloCards in Action",
  subtitle: "Watch how entrepreneurs use SoloCards to grow their business",
  videoLink: ""
};

export function useVideoSettings() {
  const [settings, setSettings] = useState<VideoSettings>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem('videoSettings');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse video settings:', error);
      }
    }
  }, []);

  const updateSettings = (newSettings: VideoSettings) => {
    setSettings(newSettings);
    localStorage.setItem('videoSettings', JSON.stringify(newSettings));
  };

  return { settings, updateSettings };
}