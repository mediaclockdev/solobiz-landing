"use client";
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function SectionWrapper({ children, className, id }: SectionWrapperProps) {
  return (
    <section 
      id={id}
      className={cn("py-24 sm:py-32", className)}
    >
      {children}
    </section>
  );
}