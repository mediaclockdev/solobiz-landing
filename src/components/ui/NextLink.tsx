'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface NextLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function NextLink({ to, children, className, onClick }: NextLinkProps) {
  return (
    <Link href={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
