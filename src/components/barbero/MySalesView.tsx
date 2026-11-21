'use client';

import { useSearchParams } from 'next/navigation';
import { NEGOCIO, YO } from '@/lib/constants';
import { HOY, cap, cop, fLarga, plural } from '@/lib/format';
import { useSaleForm } from '@/hooks/useSaleForm';
import { useVentas } from '@/hooks/useVentas';
import { PanelShell } from '../layout/PanelShell';
import { PageHeader } from '../ui/PageHeader';
import { SaleForm } from '../shared/SaleForm';
import { SaleRow } from '../shared/SaleRow';

export function MySalesView() {
  const q = useSearchParams();
  const { ventas, caja } = useVentas();
  const vf = useSaleForm('barbero', q.get('cita'));
  const c = caja(YO);
  const com = c.total * NEGOCIO.comision;
  const mias = ventas.filter((v) => v.b === YO).slice().sort((a, z) => z.t - a.t || z.ticket - a.ticket);

  return (
    <PanelShell rol="barbero" active="ventas">
      <PageHeader eyebrow={cap(fLarga(HOY))} title="Mis ventas" />
      <div className="vgrid">
        <div><SaleForm vf={vf} /></div>
        <aside className="stack-v" style={{ gap: 18 }} aria-label="Mi resumen del día">
          <section className="card card-pad tile-marble" aria-label="Lo que llevas hoy">
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-text)' }}>Lo que llevas hoy</h2>
            <span className="caja-total num" style={{ fontSize: 44, display: 'block', margin: '10px 0 8px' }}>{cop(com + c.propinas)}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Tu comisión ({NEGOCIO.comision * 100} %) más tus propinas, en {plural(c.servicios, 'servicio', 'servicios')}.</span>
            <div className="rows" style={{ marginTop: 12, borderTop: '1px solid var(--line-2)' }}>
              <div className="kv"><span>Ventas netas</span><span className="num">{cop(c.total)}</span></div>
              <div className="kv"><span>Mi comisión</span><span className="num">{cop(com)}</span></div>
              <div className="kv"><span>Propinas</span><span className="num">{cop(c.propinas)}</span></div>
            </div>
          </section>
          <section className="card card-pad" aria-labelledby="t-mias">
            <div className="card-head"><h2 className="card-title" id="t-mias">Mis ventas de hoy</h2></div>
            {mias.length ? mias.map((v) => <SaleRow key={v.ticket} v={v} rol="barbero" />) : <p className="muted">Aún no registras ventas hoy.</p>}
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>¿Te equivocaste en una venta? Pídele al administrador que la anule; tú no puedes borrarla.</p>
          </section>
        </aside>
      </div>
    </PanelShell>
  );
}
