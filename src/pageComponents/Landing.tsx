"use client";
import { HeroSection, FeaturesSection, TestimonialsSection, StatsSection, CTASection } from '@/components/landing/sections';
import { VideoDisplaySection } from '@/components/landing/VideoDisplaySection';
import { Footer } from '@/components/landing/Footer';
import { useVideoSettings } from '@/hooks/use-video-settings';

export default function Landing() {
  const { settings } = useVideoSettings();

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <VideoDisplaySection 
        title={settings.title}
        subtitle={settings.subtitle}
        videoUrl={settings.videoLink}
      />
      <CTASection />
      <Footer />
    </div>
  );
}