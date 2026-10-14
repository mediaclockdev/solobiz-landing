"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="sticky top-0 z-50 w-full transition-all duration-300 bg-background/80 backdrop-blur-sm shadow-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-primary">
            SoloBizCards.com
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="https://solo-card-funnel.vercel.app/"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background h-10 px-4 py-2 border-primary text-primary hover:bg-primary/10 hover:text-primary"
            >
              Take The 21-Day Challenge
            </Link>
            <Link
              href="/dashboards/cards"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background h-10 px-4 py-2 border-primary text-primary hover:bg-primary/10 hover:text-primary"
            >
              Create My Free Card
            </Link>
          </div>

          {/* Mobile Link */}
          <div className="md:hidden">
            <Link
              href="#cta"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground h-9 rounded-md px-3 bg-accent hover:bg-accent/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-grow">
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-foreground mb-4 font-headline">
              Ditch Paper. Go Digital. Grow Faster.
              <br />
              <span className="text-primary">Earn Income.</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
              SoloBizCards focuses on helping Solo business owners and
              side-hustlers in particular, to share your business in seconds --
              grow your referrals instantly -- and turn everyday networking into
              passive income.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 rounded-md px-8 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                href="https://solo-biz-cards-remix.vercel.app"
              >
                Create My Free Digital Card
              </a>
              <a
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-md px-8"
                href="https://solo-card-funnel.vercel.app/"
              >
                Earn With Us → Take The 21-Day Challenge
              </a>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-circle-check-big h-5 w-5 text-primary"
              >
                <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                <path d="m9 11 3 3L22 4"></path>
              </svg>
              <span>No credit card required</span>
            </div>

            <div className="mt-16">
              <div className="flex justify-center mb-8 relative z-10">
                <form
                  action="https://www.paypal.com/donate"
                  method="post"
                  target="_top"
                >
                  <input
                    type="hidden"
                    name="campaign_id"
                    value="6XF6U5KNSYY9G"
                  />
                  <input
                    type="image"
                    src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif"
                    title="PayPal - The safer, easier way to pay online!"
                    alt="Donate with PayPal button"
                    name="submit"
                  />
                  <img
                    alt=""
                    src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif"
                    width="1"
                    height="1"
                  />
                </form>
              </div>

              <div className="relative -mt-20 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-background via-background/50 to-transparent"></div>
                <img
                  alt="SoloBizCards dashboard showing card analytics"
                  width="1200"
                  height="600"
                  className="rounded-lg shadow-2xl mx-auto"
                  src="https://solo-biz-cards-reps.vercel.app/dashboard-screenshot-3.png"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
