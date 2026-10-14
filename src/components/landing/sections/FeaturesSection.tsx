"use client";
import { CreditCard, Download, Share, QrCode, Palette, Zap } from 'lucide-react';

const features = [
  {
    name: 'Easy to Create',
    description: 'Build your digital business card in minutes with our intuitive form-based editor.',
    icon: CreditCard,
  },
  {
    name: 'Instant Sharing',
    description: 'Share your card via QR code, link, or download as an image for any platform.',
    icon: Share,
  },
  {
    name: 'QR Code Generation',
    description: 'Automatically generate QR codes for instant contact sharing and networking.',
    icon: QrCode,
  },
  {
    name: 'Custom Branding',
    description: 'Personalize your card with custom colors, logos, and professional layouts.',
    icon: Palette,
  },
  {
    name: 'Download Options',
    description: 'Export your card as high-quality images for printing or digital use.',
    icon: Download,
  },
  {
    name: 'Lightning Fast',
    description: 'Create and share your professional digital business card in under 5 minutes.',
    icon: Zap,
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need for professional networking
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Create stunning digital business cards with all the features you need to make lasting connections.
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
    </section>
  );
}