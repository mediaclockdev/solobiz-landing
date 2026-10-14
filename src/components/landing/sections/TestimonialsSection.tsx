"use client";
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    company: 'TechCorp',
    content: 'SoloCards transformed how I network. The digital cards are professional, easy to share, and have increased my connection rate by 300%.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Freelance Designer',
    company: 'Independent',
    content: 'As a designer, I appreciate beautiful, functional tools. SoloCards delivers both - my clients love the professional presentation.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Sales Manager',
    company: 'StartupHub',
    content: 'The QR code feature is a game-changer. Prospects can instantly save my contact info, and I can track engagement in real-time.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-muted/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by professionals worldwide
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Join thousands of professionals who've upgraded their networking game with SoloCards.
          </p>
        </div>
        
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex flex-col justify-between rounded-2xl bg-background p-8 shadow-sm ring-1 ring-border hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="text-lg leading-7 text-foreground">
                  "{testimonial.content}"
                </blockquote>
              </div>
              <figcaption className="mt-6 flex items-center gap-x-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </figcaption>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}