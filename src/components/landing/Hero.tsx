"use client";

import { Button } from "@/components/ui/button";
import { CreditCard, Sparkles, Share2 } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              Free Digital Business Cards
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Create Beautiful
            <span className="block text-primary">Digital Business Cards</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Design, share, and download professional digital business cards in
            minutes. No design skills required. Perfect for modern
            professionals.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/onboarding">
                <CreditCard className="mr-2 h-5 w-5" />
                Get Started Free
              </Link>
            </Button>

            <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/dashboard">
                <Share2 className="mr-2 h-5 w-5" />
                View Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
