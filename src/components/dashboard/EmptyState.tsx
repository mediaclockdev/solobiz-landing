"use client";
import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  onCreateCard: () => void;
}

export function EmptyState({ onCreateCard }: EmptyStateProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full text-center bg-card rounded-xl shadow-xl border border-border p-8 transform transition-all">
        <div className="relative">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-primary/5">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            No Business Cards Yet
          </h2>
          <p className="text-muted-foreground mb-8">
            Start building your network by creating your first digital business card.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('unsaved_card_data');
              onCreateCard();
            }}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 font-medium"
          >
            <Plus size={20} />
            Create Your First Card
          </button>
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent rounded-xl" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}