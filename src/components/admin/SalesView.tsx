'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { METODOS } from '@/lib/constants';
import { HOY, cap, cop, digits, fLarga, miles, plural } from '@/lib/format';
import { useUI } from '@/context/UIContext';
import { useBarberos } from '@/hooks/useBarberos';
import { useSaleForm } from '@/hooks/useSaleForm';
import { useVentas } from '@/hooks/useVentas';
import { PanelShell } from '../layout/PanelShell';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Field, Select } from '../ui/Form';
import { PageHeader } from '../ui/PageHeader';
import { SaleForm } from '../shared/SaleForm';
import { SaleRow } from '../shared/SaleRow';

export function SalesView() {
  const q = useSearchParams();
  const { ventas, caja, cerrarCaja } = useVentas();
  const { activos } = useBarberos();
  const { toast } = useUI();
  const [filtro, setFiltro] = useState('todos');
  const [todas, setTodas] = useState(false);
  const [cierre, setCierre] = useState<string | null>(null);
  const vf = useSaleForm('admin', q.get('cita'), () => setTodas(false));

  const cj = caja();
  const vs = ventas.filter((v) => filtro === 'todos' || v.b === filtro).slice().sort((a, z) => z.t - a.t || z.ticket - a.ticket);
  const show = todas ? vs : vs.slice(0, 7);
  const contado = cierre ? +digits(cierre) : 0;
  const dif = contado - cj.metodos.efectivo;

  return (
    <PanelShell rol="admin" active="ventas">
      <PageHeader eyebrow={'Caja · ' + fLarga(HOY)} title="Ventas" actions={<Link className="btn btn-quiet" href="/admin/reportes"><Icon name="report" size={18} />Ver reportes</Link>} />
      <div className="vgrid">
        <div><SaleForm vf={vf} /></div>
        <aside className="stack-v" style={{ gap: 18 }} aria-label="Resumen de caja">
          <section className="card card-pad tile-marble" aria-label="Hoy en caja">
            <div className="card-head"><h2 className="card-title">Hoy en caja</h2><Badge cls="b-gold" dot={false}>{plural(cj.n, 'venta', 'ventas')}</Badge></div>
            <span className="caja-total num">{cop(cj.total)}</span>
            <span className="muted" style={{ fontSize: 13, display: 'block', margin: '6px 0 14px' }}>+ {cop(cj.propinas)} en propinas para los barberos</span>
            <div className="rows">{METODOS.map(([id, t]) => <div className="kv" key={id}><span>{t}</span><span className="num">{cop(cj.metodos[id])}</span></div>)}</div>
            <button type="button" className="btn btn-quiet btn-block" style={{ marginTop: 14 }} onClick={() => setCierre('')}><Icon name="lock" size={18} />Hacer cierre de caja</button>
          </section>
          <section className="card card-pad" aria-labelledby="t-ult">
            <div className="card-head">
              <h2 className="card-title" id="t-ult">Últimas ventas</h2>
              <label className="sr-only" htmlFor="vs-b">Filtrar por barbero</label>
              <Select id="vs-b" style={{ width: 'auto', minHeight: 40 }} value={filtro} onChange={(e) => { setFiltro(e.target.value); setTodas(false); }}
                options={[['todos', 'Todos'], ...activos.map((b) => [b.id, b.corto] as [string, string])]} />
            </div>
            {show.length ? show.map((v) => <SaleRow key={v.ticket} v={v} rol="admin" />) : <p className="muted" style={{ padding: '10px 0' }}>Sin ventas para este barbero hoy.</p>}
            {vs.length > 7 && <button type="button" className="link" onClick={() => setTodas(!todas)}>{todas ? 'Ver menos' : 'Ver todas las ventas del día (' + vs.length + ')'}</button>}
          </section>
        </aside>
      </div>

      {cierre !== null && (
        <Modal title="Cierre de caja" onClose={() => setCierre(null)}
          foot={<>
            <button type="button" className="btn btn-quiet" onClick={() => setCierre(null)}>Cancelar</button>
            <button type="button" className="btn btn-gold" onClick={async () => { await cerrarCaja(contado); setCierre(null); toast('Cierre de caja registrado. El reporte del día queda disponible en Reportes.'); }}><Icon name="lock" size={18} />Confirmar cierre</button>
          </>}>
          <p className="muted">{cap(fLarga(HOY))} · {plural(cj.n, 'venta', 'ventas')}. Cuenta el efectivo del cajón y compáralo con lo registrado.</p>
          <div className="rows">
            {METODOS.map(([id, t]) => <div className="kv" key={id}><span>{t} esperado</span><span className="num">{cop(cj.metodos[id])}</span></div>)}
            <div className="kv"><span>Propinas a entregar</span><span className="num">{cop(cj.propinas)}</span></div>
          </div>
          <Field label="Efectivo contado en el cajón">
            <span className="igroup"><span>$</span><input inputMode="numeric" placeholder={miles(cj.metodos.efectivo)} value={cierre} onChange={(e) => { const d = digits(e.target.value); setCierre(d ? miles(+d) : ''); }} /></span>
          </Field>
          <p className="muted" aria-live="polite">
            {cierre ? (dif === 0 ? <span style={{ color: 'var(--ok)' }}>Cuadra exacto.</span> : <>Diferencia: <b style={{ color: dif > 0 ? 'var(--ok)' : 'var(--bad)' }}>{(dif > 0 ? '+' : '') + cop(dif)}</b></>) : null}
          </p>
        </Modal>
      )}
    </PanelShell>
  );
}
