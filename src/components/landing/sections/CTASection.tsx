"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CreditCard } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-primary">
      <div className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to create your digital business card?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
            Join thousands of professionals who've already made the switch to
            digital business cards.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6"
            >
              <Link href="/onboarding">
                <CreditCard className="mr-2 h-5 w-5" />
                Start Creating
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-primary-foreground/60">
            100% free • No credit card required • Ready in minutes
          </p>
        </div>
      </div>
    </section>
  );
}
