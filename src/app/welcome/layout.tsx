import type { ReactNode } from "react";

/**
 * The /welcome campaign funnel.
 *
 * A self-contained ad-landing funnel: its own landing page, login, signup and
 * onboarding, all framed as a phone-width app. It deliberately does NOT share
 * layout with the main site - `/`, `/login` and `/signup` keep their own
 * chrome and are untouched by anything in this folder.
 *
 * The frame is the whole point of the layout: on a phone it is simply the
 * screen, and on a desktop it keeps the same column width so an ad click looks
 * identical whichever device it arrives from.
 */
export default function WelcomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[500px] overflow-x-hidden bg-background shadow-md [--primary:0_0%_9%] [--primary-foreground:0_0%_98%] [--ring:0_0%_9%]">
      {children}
    </div>
  );
}
