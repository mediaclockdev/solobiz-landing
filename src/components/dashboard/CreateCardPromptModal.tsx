'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard } from 'lucide-react';
import { useNavigate } from '@/lib/navigation';

interface CreateCardPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCardPromptModal({ isOpen, onClose }: CreateCardPromptModalProps) {
  const navigate = useNavigate();

  const handleCreateCard = () => {
    onClose();
    // Clear any existing edit data and navigate to onboarding
    localStorage.removeItem('edit_card_data');
    navigate('/');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-lg">
        <div className="text-center space-y-6 pt-4">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <CreditCard size={32} className="text-blue-600" />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">
              Create Your First Business Card
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              To access your dashboard, you need to create and save at least one business card. 
              Get started by creating your free digital business card now!
            </p>
          </div>

          {/* Action Button */}
          <div className="space-y-3">
            <Button 
              onClick={handleCreateCard}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            >
              <Plus size={20} />
              Create Your Business Card
            </Button>
            
            <p className="text-xs text-gray-500">
              It only takes a few minutes to get started
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
