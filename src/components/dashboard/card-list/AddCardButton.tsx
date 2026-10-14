"use client";
import React from 'react';
import { Plus } from 'lucide-react';

interface AddCardButtonProps {
  onCreateCard: () => void;
}

export function AddCardButton({ onCreateCard }: AddCardButtonProps) {
  return (
    <div 
      onClick={onCreateCard}
      className="bg-card rounded-lg shadow-sm border border-border border-dashed p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
          <Plus className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Add Card</h3>
          <p className="text-sm text-muted-foreground mt-1">Click here to add new card</p>
        </div>
      </div>
    </div>
  );
}