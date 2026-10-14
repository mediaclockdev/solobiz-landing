"use client";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SignatureLayout } from './types';

interface SignatureLayoutSelectorProps {
  selectedLayout: SignatureLayout;
  onLayoutChange: (layout: SignatureLayout) => void;
}

export function SignatureLayoutSelector({ selectedLayout, onLayoutChange }: SignatureLayoutSelectorProps) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Layout Options</Label>
      <RadioGroup 
        value={selectedLayout} 
        onValueChange={(value) => onLayoutChange(value as SignatureLayout)}
        className="space-y-3"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="text-only" id="text-only" />
          <Label htmlFor="text-only" className="cursor-pointer">
            Text Only
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="profile-photo" id="profile-photo" />
          <Label htmlFor="profile-photo" className="cursor-pointer">
            Profile Photo + Text
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="company-logo" id="company-logo" />
          <Label htmlFor="company-logo" className="cursor-pointer">
            Company Logo + Text
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="logo-photo-text" id="logo-photo-text" />
          <Label htmlFor="logo-photo-text" className="cursor-pointer">
            Company Logo + Profile Photo + Text
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}