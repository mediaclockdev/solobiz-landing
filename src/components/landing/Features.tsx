"use client";
import { Download, Share2, Smartphone, Globe, Edit, Zap } from 'lucide-react';

const features = [
  {
    name: 'Easy to Create',
    description: 'Build your digital business card in minutes with our intuitive form builder.',
    icon: Edit,
  },
  {
    name: 'Instant Sharing',
    description: 'Share your card via QR code, link, or direct download with anyone, anywhere.',
    icon: Share2,
  },
  {
    name: 'Mobile Optimized',
    description: 'Your cards look perfect on any device - desktop, tablet, or mobile.',
    icon: Smartphone,
  },
  {
    name: 'Download & Export',
    description: 'Export as image, vCard, or share a live link. Multiple formats supported.',
    icon: Download,
  },
  {
    name: 'Professional Design',
    description: 'Beautiful, modern templates that make a great first impression.',
    icon: Zap,
  },
  {
    name: 'Always Accessible',
    description: 'Your cards are available 24/7 with our reliable cloud hosting.',
    icon: Globe,
  },
];

export function Features() {
  return (
    <div className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Everything you need</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Professional business cards made simple
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Create, customize, and share your digital business cards with ease. 
            No technical skills required.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <feature.icon className="h-5 w-5 flex-none text-primary" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}