"use client";
import { BusinessCard } from '@/types/businessCard';
import { CardEditForm } from '@/components/dashboard/CardEditForm';

interface EditTabProps {
  card: BusinessCard;
  onUpdate: (updatedCard: BusinessCard) => void;

}

export function EditTab({ card, onUpdate}: EditTabProps) {
  return (
    <div className="space-y-4">
      <CardEditForm card={card} onUpdate={onUpdate} />
    </div>
  );
}