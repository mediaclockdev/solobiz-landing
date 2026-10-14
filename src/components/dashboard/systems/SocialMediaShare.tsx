"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function SocialMediaShare() {
  const websiteUrl = process.env.NEXT_PUBLIC_API_LIVE_URL;
  const shareText =
    "Check out SoloBizCards - Create professional digital business cards for free! 🚀";
  const hashtags = "DigitalBusinessCards,Networking,SoloBizCards,BusinessCards";

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      websiteUrl
    )}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(websiteUrl)}&hashtags=${hashtags}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      websiteUrl
    )}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct URL sharing, so we'll copy to clipboard
    navigator.clipboard.writeText(`${shareText} ${websiteUrl}`).then(() => {
      alert(
        "Text copied to clipboard! You can now paste it in your Instagram post or story."
      );
    });
  };

  const copyToClipboard = () => {
    const fullText = `${websiteUrl}`;
    navigator.clipboard.writeText(fullText).then(() => {
      alert("Share text copied to clipboard!");
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Share2 className="h-5 w-5 text-blue-600" />
          Share SoloBizCards
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Help spread the word about our platform
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm font-medium mb-2">Share Message:</p>
          <p className="text-sm text-gray-700 italic">"{shareText}"</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={shareToFacebook}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
          >
            <Facebook className="h-4 w-4 text-blue-600" />
            Facebook
          </Button>

          <Button
            onClick={shareToTwitter}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-sky-50 hover:border-sky-300"
          >
            <Twitter className="h-4 w-4 text-sky-500" />
            Twitter
          </Button>

          <Button
            onClick={shareToLinkedIn}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
          >
            <Linkedin className="h-4 w-4 text-blue-700" />
            LinkedIn
          </Button>

          <Button
            onClick={shareToInstagram}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-pink-50 hover:border-pink-300"
          >
            <Instagram className="h-4 w-4 text-pink-600" />
            Instagram
          </Button>
        </div>

        <Button
          onClick={copyToClipboard}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          Copy Share Text
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Facebook & Twitter: Opens sharing dialog</p>
          <p>• LinkedIn: Opens sharing page</p>
          <p>• Instagram: Copies text to clipboard</p>
        </div>
      </CardContent>
    </Card>
  );
}
