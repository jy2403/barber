'use client';

import { useEffect } from 'react';

/** Agrega una clase al <body> mientras el componente está montado */
export function useBodyClass(cls: string | null) {
  useEffect(() => {
    if (!cls) return;
    document.body.classList.add(cls);
    return () => document.body.classList.remove(cls);
  }, [cls]);
}
