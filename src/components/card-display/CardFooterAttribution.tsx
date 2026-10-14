"use client";
import React from 'react';
import { BusinessCard } from '@/types/businessCard';

interface CardFooterAttributionProps {
  card: BusinessCard;
}

export function CardFooterAttribution({ card }: CardFooterAttributionProps) {
  return (
    <div className="mt-4 text-center">
      <div 
        className="inline-block px-4 py-2 rounded-full text-white text-xs font-medium shadow-sm"
        style={{ backgroundColor: card.brandColor }}
      >
        <span className="opacity-90">Created by:123 </span>
        <a 
          href={process.env.NEXT_PUBLIC_API_LIVE_URL}
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:opacity-80 transition-opacity underline"
        >
          [{process.env.NEXT_PUBLIC_API_LIVE_URL}]
        </a>
      </div>
    </div>
  );
}