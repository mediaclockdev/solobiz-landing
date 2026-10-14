"use client";
import React from 'react';
import { FormComponentProps } from '@/types/businessCard';
import { TemplateSelectionSection } from './TemplateSelectionSection';
import { CardDesignSelection } from './CardDesignSelection';
import { ImageUploadGrid } from './ImageUploadGrid';

export function ImageUploadSection({ card, onUpdate, isEditMode }: FormComponentProps) {
  return (
    <div className="space-y-4">
      <TemplateSelectionSection card={card} onUpdate={onUpdate} isEditMode={isEditMode} />
      <CardDesignSelection card={card} onUpdate={onUpdate} isEditMode={isEditMode} />
      <ImageUploadGrid card={card} onUpdate={onUpdate} isEditMode={isEditMode} />
    </div>
  );
}