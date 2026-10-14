'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Sparkles } from 'lucide-react';

export function LifetimeOfferButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleGetOffer = () => {
    window.open('https://www.paypal.com/donate?campaign_id=6XF6U5KNSYY9G', '_blank');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-2 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 text-white font-bold py-3 px-4 rounded-full shadow-lg animate-pulse hover:animate-none transition-all duration-300 transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Limited LIFE-TIME Offer!
        </Button>
      </div>

      {/* Lightbox Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md mx-auto bg-white rounded-lg shadow-2xl border-0">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-800 mb-2">
              🎉 Unlock Lifetime Value!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p className="text-lg font-semibold text-center text-blue-600">
              Become a LIFE-TIME Card Member today.
            </p>
            
            <p className="text-center">
              Enjoy unlimited access and exclusive features—forever—with a single payment of{' '}
              <span className="font-bold text-green-600 text-xl">$99, for 2-Cards</span>.
            </p>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="font-semibold text-yellow-800 mb-2">But that's not all!</p>
              <p className="text-sm">
                Refer others and earn up to <span className="font-bold text-green-600">50% recurring commission</span> on every paid membership from your referrals.
              </p>
            </div>
            
            <p className="text-sm">
              Your own membership can pay for itself in no time—and you could enjoy ongoing passive income, just by sharing your business card.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-center">
              <p className="font-semibold text-blue-800">
                No monthly fees. No renewals.
              </p>
              <p className="text-sm text-blue-600">
                Just lifetime value and real earnings!
              </p>
            </div>
            
            <p className="text-center font-medium">
              Join us and start getting more from your network. Your support will help us complete final phase of this project [the backend development]. Estimated completion in 2-months. Our proposed Launch Date is Oct. 1st. 2025.
            </p>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleGetOffer}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 text-lg"
            >
              Get Offer Now! 🚀
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="px-4"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
