'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, Check } from 'lucide-react';
import { useNavigate } from '@/lib/navigation';
import { saveUserData, UserAccountData } from '@/utils/userStorage';
import { loadBusinessCards } from '@/utils/cardStorage';
import emailjs from '@emailjs/browser';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  firstName: string;
}

export function WelcomeModal({ isOpen, onClose, firstName }: WelcomeModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [hearAboutUs, setHearAboutUs] = useState('');
  const [showHearAboutSection, setShowHearAboutSection] = useState(false);
  const [showDashboardButton, setShowDashboardButton] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    const isValid = emailRegex.test(email);
    setIsEmailValid(isValid);
    
    if (isValid && !showHearAboutSection) {
      // Show "How did you hear about us?" section with animation
      setTimeout(() => setShowHearAboutSection(true), 100);
    } else if (!isValid && showHearAboutSection) {
      // Hide subsequent sections if email becomes invalid
      setShowHearAboutSection(false);
      setShowDashboardButton(false);
      setHearAboutUs('');
    }
  }, [email, showHearAboutSection]);

  useEffect(() => {
    if (hearAboutUs && !showDashboardButton) {
      // Show dashboard button when option is selected
      setTimeout(() => setShowDashboardButton(true), 100);
    } else if (!hearAboutUs && showDashboardButton) {
      setShowDashboardButton(false);
    }
  }, [hearAboutUs, showDashboardButton]);

  const handleGoToDashboard = async () => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Get business card data
      const businessCards = loadBusinessCards();
      const businessCard = businessCards.length > 0 ? businessCards[0] : null;

      // Prepare email data
      const emailData = {
        to_email: 'robuc33@gmail.com',
        user_name: firstName,
        user_email: email,
        referral_source: hearAboutUs,
        registration_date: new Date().toLocaleString('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        // Business card details
        company: businessCard?.profile?.company || 'Not provided',
        job_title: businessCard?.profile?.title || 'Not provided',
        business_phone: businessCard?.business?.phone || 'Not provided',
        business_email: businessCard?.business?.email || 'Not provided',
        website: businessCard?.business?.website || 'Not provided',
        address: businessCard?.business?.address ? 
          `${businessCard.business.address.street}, ${businessCard.business.address.city}, ${businessCard.business.address.state} ${businessCard.business.address.zip}, ${businessCard.business.address.country}` : 
          'Not provided',
        card_template: businessCard?.templateType || 'Not specified',
        card_layout: businessCard?.cardLayout || 'Not specified',
        card_created: businessCard?.metadata?.createdAt ? 
          new Date(businessCard.metadata.createdAt).toLocaleString('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Not available'
      };

      // Send email via EmailJS
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
        emailData,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || ''
      );

      setSubmitMessage('✅ Registration successful!');
      
      // Save user data to localStorage
      const userData: UserAccountData = {
        email,
        hearAboutUs,
        firstName,
        registrationDate: new Date().toISOString(),
        hasCompletedOnboarding: true
      };
      
      saveUserData(userData);
      
      // Small delay to show success message
      setTimeout(() => {
        onClose();
        navigate('/dashboard/cards');
      }, 1000);

    } catch (error) {
      console.error('Error sending email:', error);
      setSubmitMessage('Registration saved locally. Email notification failed.');
      
      // Still save user data even if email fails
      const userData: UserAccountData = {
        email,
        hearAboutUs,
        firstName,
        registrationDate: new Date().toISOString(),
        hasCompletedOnboarding: true
      };
      
      saveUserData(userData);
      
      // Continue to dashboard after showing error
      setTimeout(() => {
        onClose();
        navigate('/dashboard/cards');
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state when closing
    setEmail('');
    setIsEmailValid(false);
    setHearAboutUs('');
    setShowHearAboutSection(false);
    setShowDashboardButton(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-lg">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-0 top-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {/* <X size={20} className="text-gray-500" /> */}
          </button>

          <div className="text-center space-y-6 pt-4">
            {/* Success icon */}
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={32} className="text-white" />
            </div>

            {/* Welcome message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">
                Hello {firstName}! 🎉
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Congratulations! Your free business card has been successfully created. Ready to see it in action? Let's get you set up in your dashboard.
              </p>
            </div>

            {/* Progressive form */}
            <div className="space-y-6 text-left">
              {/* Email field - always visible */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`transition-all duration-300 ${
                    email && !isEmailValid 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : isEmailValid 
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                      : ''
                  }`}
                />
              </div>

              {/* How did you hear about us section - appears after valid email */}
              <div 
                className={`transition-all duration-400 ease-in-out ${
                  showHearAboutSection 
                    ? 'opacity-100 translate-y-0 max-h-96' 
                    : 'opacity-0 translate-y-4 max-h-0 overflow-hidden'
                }`}
              >
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    How did you hear about us?
                  </Label>
                  <RadioGroup value={hearAboutUs} onValueChange={setHearAboutUs}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="social-media" id="social-media" />
                        <Label htmlFor="social-media" className="flex-1 cursor-pointer text-sm">
                          Social Media (Facebook, Instagram, Twitter)
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="search-engine" id="search-engine" />
                        <Label htmlFor="search-engine" className="flex-1 cursor-pointer text-sm">
                          Search Engine (Google, Bing)
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="referral" id="referral" />
                        <Label htmlFor="referral" className="flex-1 cursor-pointer text-sm">
                          Friend or Colleague Referral
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other" className="flex-1 cursor-pointer text-sm">
                          Other
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Submit message */}
              {submitMessage && (
                <div className="text-center text-sm font-medium">
                  {submitMessage}
                </div>
              )}

              {/* Dashboard button - appears after selection */}
              <div 
                className={`transition-all duration-400 ease-in-out ${
                  showDashboardButton 
                    ? 'opacity-100 translate-y-0 max-h-20' 
                    : 'opacity-0 translate-y-4 max-h-0 overflow-hidden'
                }`}
              >
                <Button 
                  onClick={handleGoToDashboard}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? 'Setting up your account...' : 'Go to Dashboard'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
