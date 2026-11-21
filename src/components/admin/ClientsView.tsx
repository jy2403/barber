'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import type { Segmento } from '@/types';
import { NEGOCIO, SEG } from '@/lib/constants';
import { HOY, addDays, cop, fDMA, fMesA, norm, sameDay } from '@/lib/format';
import { ultimaTxt } from '@/lib/domain/sales';
import { scrollBehavior, useUI } from '@/context/UIContext';
import { useBarberos } from '@/hooks/useBarberos';
import { useClientes } from '@/hooks/useClientes';
import { PanelShell } from '../layout/PanelShell';
import { AvatarIni } from '../ui/Avatar';
import { DetailClose } from '../ui/DetailClose';
import { Icon } from '../ui/Icon';
import { MiniKpi, PageHeader } from '../ui/PageHeader';

const SEGS: ['todos' | Segmento, string][] = [['todos', 'Todos'], ['frecuente', 'Frecuentes'], ['nuevo', 'Nuevos'], ['inactivo', 'Sin volver +60 días']];
const SERVS: [string, number][] = [['Combo cabello + barba', 55000], ['Corte de cabello', 35000], ['Combo + diseño de cejas', 67000], ['Perfilado y diseño de barba', 25000]];

export function ClientsView() {
  const params = useSearchParams();
  const { clientes } = useClientes();
  const { porId } = useBarberos();
  const { toast, openSheet } = useUI();
  const detail = useRef<HTMLElement>(null);
  const segIni = params.get('seg');
  const [q, setQ] = useState('');
  const [seg, setSeg] = useState<'todos' | Segmento>(segIni && segIni in SEG ? (segIni as Segmento) : 'todos');
  const [sel, setSel] = useState(0);

  const nq = norm(q);
  const idx = clientes.map((_, i) => i).filter((i) => {
    const c = clientes[i];
    return (seg === 'todos' || c.seg === seg) && (!nq || norm(c.nombre).includes(nq) || norm(c.cel).includes(nq) || norm(c.correo).includes(nq));
  });
  const c = clientes[sel] || clientes[0];
  const corto = (id: string) => porId(id)?.corto || '—';

  const elegir = (i: number) => {
    setSel(i);
    setTimeout(() => {
      if (!openSheet(detail.current)) {
        const d = detail.current;
        if (d && d.getBoundingClientRect().top > window.innerHeight) d.scrollIntoView({ behavior: scrollBehavior() });
      }
    }, 0);
  };

  const fechas = [0, 24, 45, 66].map((k) => addDays(HOY, -(c.dias + k)));

  return (
    <PanelShell rol="admin" active="clientes">
      <PageHeader eyebrow="Base de clientes" title="Clientes" actions={<button type="button" className="btn btn-quiet" onClick={() => toast('Exportando 1.284 clientes a Excel…', 'download')}><Icon name="download" size={18} />Exportar</button>} />
      <div className="mini-kpis">
        <MiniKpi label="Clientes registrados" value="1.284" />
        <MiniKpi label="Nuevos en octubre" value="96" />
        <MiniKpi label="Vuelven en menos de 60 días" value="71 %" />
        <MiniKpi label="Sin volver hace +60 días" value="212" />
      </div>
      <div className="cl-layout">
        <section className="card" aria-label="Listado de clientes">
          <div className="toolbar">
            <label className="search"><Icon name="search" size={18} /><span className="sr-only">Buscar cliente</span><input type="search" value={q} placeholder="Nombre, celular o correo" onChange={(e) => setQ(e.target.value)} /></label>
            <div className="chips-scroll" role="group" aria-label="Segmento">
              {SEGS.map(([id, t]) => <button key={id} type="button" className="chip chip-pill" aria-pressed={seg === id} onClick={() => setSeg(id)}>{t}</button>)}
            </div>
          </div>
          <div className="clist">
            <div className="cl-head"><span>Cliente</span><span className="r">Visitas</span><span>Última visita</span><span className="r">Total gastado</span><span>Barbero</span></div>
            {idx.length ? idx.map((i) => {
              const x = clientes[i];
              const t = SEG[x.seg];
              const ult = ultimaTxt(x);
              const rojo = x.dias > 60 ? { color: 'var(--bad)' } : undefined;
              return (
                <button key={x.nombre + i} type="button" className="crow" aria-pressed={i === sel} onClick={() => elegir(i)}>
                  <span className="cr-who"><AvatarIni name={x.nombre} /><span><span className="cr-name"><b>{x.nombre}</b></span><small className="cr-sub"><span className="num">{x.cel}</span><span className={'badge ' + t.cls}>{t.txt}</span></small></span></span>
                  <span className="cr-vis num r">{x.visitas}</span>
                  <span className="cr-ult" style={rojo}>{ult}</span>
                  <span className="cr-total num r">{cop(x.total)}</span>
                  <span className="cr-bar">{corto(x.barbero)}</span>
                  <span className="cr-m"><span className={'badge ' + t.cls}>{t.txt}</span><span>Visitas <b>{x.visitas}</b></span><span>Última <b style={rojo}>{ult}</b></span><span>Barbero <b>{corto(x.barbero)}</b></span></span>
                </button>
              );
            }) : <p className="empty">No hay clientes con esa búsqueda.</p>}
          </div>
          <div className="list-foot"><span>Mostrando {idx.length} de 1.284 clientes</span><span>Toca un cliente para ver su ficha.</span></div>
        </section>

        <aside className="card detail" id="detail" ref={detail} aria-label="Ficha del cliente">
          <span className="sheet-grip" />
          <div className="ficha-head">
            <AvatarIni name={c.nombre} className="av-lg" />
            <span className="ficha-text"><b>{c.nombre}</b><small>{c.cel} · {c.correo}</small></span>
            <DetailClose label="Cerrar ficha" />
          </div>
          <div className="grid2x">
            <div><span>Visitas</span><b>{c.visitas}</b></div>
            <div><span>Total gastado</span><b>{cop(c.total)}</b></div>
            <div><span>Ticket promedio</span><b>{cop(Math.round(c.total / Math.max(1, c.visitas)))}</b></div>
            <div><span>No asistió</span><b style={c.noShows ? { color: 'var(--bad)' } : undefined}>{c.noShows}</b></div>
          </div>
          <div className="card-pad stack-v detail-pad-b">
            <dl className="dl">
              <div><dt>Cliente desde</dt><dd>{fMesA(c.desde)}</dd></div>
              <div><dt>Cumpleaños</dt><dd>{c.cumple}</dd></div>
              <div><dt>Preferencias</dt><dd>{c.pref}</dd></div>
            </dl>
            <p className="note note-ok"><Icon name="shield" size={18} /><span>Autorizó el tratamiento de datos y los recordatorios por WhatsApp.</span></p>
            <div>
              <span className="label-caps">Últimas visitas</span>
              <div className="rows">
                {fechas.slice(0, Math.min(4, c.visitas)).map((f, k) => {
                  const s = SERVS[(k + sel) % 4];
                  return (
                    <div className="kv" key={k}>
                      <span style={{ display: 'flex', flexDirection: 'column', color: 'var(--ink)' }}><b style={{ fontWeight: 700 }}>{s[0]}</b><small className="muted">{sameDay(f, HOY) ? 'Hoy' : fDMA(f)} · {corto(c.barbero)}</small></span>
                      <span>{cop(s[1])}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Link className="btn btn-gold" href="/agendar"><Icon name="cal" size={18} />Agendar cita</Link>
              <a className="btn btn-quiet" href={NEGOCIO.waLink} target="_blank" rel="noopener"><Icon name="wa" size={18} />WhatsApp</a>
            </div>
          </div>
        </aside>
      </div>
    </PanelShell>
  );
}
