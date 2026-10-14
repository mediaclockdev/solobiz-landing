"use client";
import React from 'react';
import { Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { X } from 'lucide-react';

interface ProFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  profilePhoto?: string;
}

export function ProFeatureModal({ isOpen, onClose, featureName, profilePhoto }: ProFeatureModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-md data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Upgrade to Pro
          </DialogTitle>
        </DialogHeader>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <div className="flex justify-center mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profilePhoto} alt="Profile" />
            <AvatarFallback>PRO</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="py-4">
          <p className="text-muted-foreground mb-4">
            <strong>{featureName}</strong> is a Pro feature. Upgrade your account to unlock advanced features like analytics, custom branding, and more.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Maybe Later
            </button>
            <button 
              onClick={() => {
                window.location.href = "/pricing";
              }}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}