'use client';

/* =========================================================
   Contexto de interfaz: avisos (toasts), menú lateral, hoja
   de detalle en móvil, modales abiertos y bloqueo del scroll.
   ========================================================= */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

interface Toast {
  id: number;
  msg: string;
  icon: string;
  out: boolean;
}

interface UIValue {
  toast: (msg: string, icon?: string) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  sheetOpen: boolean;
  /** Abre la hoja de detalle solo si el panel está flotando (lo decide el CSS). Devuelve si se abrió. */
  openSheet: (el: HTMLElement | null) => boolean;
  closeSheet: () => void;
  /** Registra un modal abierto; devuelve la función para quitarlo */
  pushModal: (onClose: () => void) => () => void;
}

const UIContext = createContext<UIValue | null>(null);

export const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const scrollBehavior = (): ScrollBehavior => (reducedMotion() ? 'auto' : 'smooth');

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalCount, setModalCount] = useState(0);
  const sheetEl = useRef<HTMLElement | null>(null);
  const modals = useRef<{ id: number; onClose: () => void }[]>([]);
  const seq = useRef(0);

  const toast = useCallback((msg: string, icon = 'check') => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, msg, icon, out: false }]);
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x)));
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 300);
    }, 3200);
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const closeSheet = useCallback(() => {
    sheetEl.current?.classList.remove('is-open');
    sheetEl.current = null;
    setSheetOpen(false);
  }, []);
  const openSheet = useCallback((el: HTMLElement | null) => {
    if (!el) return false;
    el.classList.add('is-open');
    if (getComputedStyle(el).position !== 'fixed') {
      el.classList.remove('is-open');
      return false;
    }
    sheetEl.current = el;
    setSheetOpen(true);
    el.scrollTop = 0;
    el.querySelector<HTMLElement>('.detail-close')?.focus({ preventScroll: true });
    return true;
  }, []);

  const pushModal = useCallback((onClose: () => void) => {
    const id = ++seq.current;
    modals.current.push({ id, onClose });
    setModalCount(modals.current.length);
    return () => {
      modals.current = modals.current.filter((m) => m.id !== id);
      setModalCount(modals.current.length);
    };
  }, []);

  /* Clases del body que usa el CSS */
  useEffect(() => {
    const b = document.body.classList;
    b.toggle('drawer-open', drawerOpen);
    b.toggle('sheet-open', sheetOpen);
    b.toggle('lock', drawerOpen || modalCount > 0 || (sheetOpen && isMobile()));
  }, [drawerOpen, sheetOpen, modalCount]);

  /* Escape: cierra lo que esté encima */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const top = modals.current[modals.current.length - 1];
      if (top) { top.onClose(); return; }
      if (sheetEl.current) { closeSheet(); return; }
      setDrawerOpen(false);
    };
    const onResize = () => {
      if (!isMobile()) setDrawerOpen(false);
      if (sheetEl.current && getComputedStyle(sheetEl.current).position !== 'fixed') closeSheet();
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [closeSheet]);

  const value = useMemo(
    () => ({ toast, drawerOpen, openDrawer, closeDrawer, sheetOpen, openSheet, closeSheet, pushModal }),
    [toast, drawerOpen, openDrawer, closeDrawer, sheetOpen, openSheet, closeSheet, pushModal],
  );

  return (
    <UIContext.Provider value={value}>
      {children}
      <div className="toasts" id="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={'toast' + (t.out ? ' out' : '')}>
            <Icon name={t.icon} size={18} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI debe usarse dentro de <UIProvider>');
  return ctx;
}
