'use client';

import { useUI } from '@/context/UIContext';
import { Icon } from './Icon';

/** Botón para cerrar la hoja de detalle (móvil) */
export function DetailClose({ label = 'Cerrar detalle' }: { label?: string }) {
  const { closeSheet } = useUI();
  return (
    <button type="button" className="btn btn-icon btn-quiet detail-close" onClick={closeSheet} aria-label={label}>
      <Icon name="x" size={18} />
    </button>
  );
}
