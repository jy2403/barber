'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useUI } from '@/context/UIContext';
import { Icon } from './Icon';

interface Props {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  foot?: ReactNode;
  size?: 'sm' | 'md';
  /** Selector del elemento que recibe el foco al abrir */
  focus?: string;
}

/** Diálogo modal accesible (foco inicial, Escape, clic fuera, retorno del foco) */
export function Modal({ title, onClose, children, foot, size = 'md', focus }: Props) {
  const { pushModal } = useUI();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const pop = pushModal(() => closeRef.current());
    const m = ref.current;
    const f = m?.querySelector<HTMLElement>(focus || 'input,select,textarea,.modal-foot .btn-gold') || m?.querySelector<HTMLElement>('.modal-card .btn');
    f?.focus({ preventScroll: true });
    return () => {
      pop();
      if (prev && document.contains(prev)) prev.focus({ preventScroll: true });
    };
  }, [pushModal, focus]);

  return createPortal(
    <div className="modal" id="modal" ref={ref} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={'modal-card ' + (size === 'sm' ? 'modal-sm' : '')} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-head">
          <h2 className="modal-title" id={titleId}>{title}</h2>
          <button type="button" className="btn btn-icon btn-quiet" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>,
    document.body,
  );
}
