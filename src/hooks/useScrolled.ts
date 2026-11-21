'use client';

import { useEffect, useState } from 'react';

/** true cuando la ventana se desplazó más de `offset` píxeles */
export function useScrolled(offset = 12, enabled = true) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const on = () => setScrolled(window.scrollY > offset);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [offset, enabled]);
  return scrolled;
}
