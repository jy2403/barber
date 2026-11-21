'use client';

import type { Rol, Venta } from '@/types';
import { DESCUENTOS, metodoTxt } from '@/lib/constants';
import { cop, hora } from '@/lib/format';
import { itemsTxt } from '@/lib/domain/sales';
import { useData } from '@/context/DataContext';

export function SaleRow({ v, rol }: { v: Venta; rol: Rol }) {
  const { servicios, barberos } = useData();
  const det =
    itemsTxt(servicios, v.items) +
    (rol === 'admin' ? ' · ' + (barberos.find((b) => b.id === v.b)?.corto || '') : '') +
    (v.descVal ? ' · ' + (DESCUENTOS.find((d) => d.id === v.desc)?.txt || '') : '') +
    (rol !== 'admin' && v.propina ? ' · propina ' + cop(v.propina) : '');
  return (
    <div className={'sale-row' + (v.nueva ? ' is-new' : '')}>
      <b>{hora(v.t)}</b>
      <span><strong>{v.cliente}</strong><small>{det}</small></span>
      <em><strong>{cop(v.total)}</strong><small>{metodoTxt(v.metodo)}</small></em>
    </div>
  );
}
