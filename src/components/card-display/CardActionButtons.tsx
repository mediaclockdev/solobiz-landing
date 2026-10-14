"use client";
import React from 'react';
import { BusinessCard } from '@/types/businessCard';
import { getFullName, generateVCard } from '@/utils/businessCard';
import { Share2, Download } from 'lucide-react';

interface CardActionButtonsProps {
  card: BusinessCard;
  onShare: () => void;
}

export function CardActionButtons({ card, onShare }: CardActionButtonsProps) {
  const handleSaveContact = async () => {
    const vCardData = await generateVCard(card);
    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.urlName || getFullName(card) || 'contact'}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={onShare}
        className="flex-1 px-4 py-3 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-sm flex items-center justify-center gap-2 transform hover:scale-105"
        style={{ backgroundColor: card.brandColor }}
      >
        <Share2 size={20} />
        Share Card
      </button>
      <button
        onClick={handleSaveContact}
        className="flex-1 px-4 py-3 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-sm flex items-center justify-center gap-2 transform hover:scale-105"
        style={{ backgroundColor: card.brandColor }}
      >
        <Download size={20} />
        Save Contact
      </button>
    </div>
  );
}