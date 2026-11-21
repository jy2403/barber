'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';
import { scrollBehavior } from '@/context/UIContext';

/** Enlace a una sección de la landing: desplaza suavemente si ya estamos en ella */
export function ScrollLink({ to, className, children, onNavigate }: { to: string; className?: string; children: ReactNode; onNavigate?: () => void }) {
  const pathname = usePathname();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.();
    if (pathname !== '/') return;
    const t = document.getElementById(to);
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  };
  return (
    <Link href={'/#' + to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
