'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import type { Cita, EstadoCita } from '@/types';
import { EST_CITA, metodoTxt } from '@/lib/constants';
import { AHORA_DEMO, HOY, cap, cop, diffDays, fDeMes, fLarga, hora, horaH, plural, relDia, sameDay, ticketTxt } from '@/lib/format';
import { enVac, rangosDe } from '@/lib/domain/availability';
import { porAtender } from '@/lib/domain/sales';
import { useUI } from '@/context/UIContext';
import { useAgendaBoard } from '@/hooks/useAgendaBoard';
import { useBarberos } from '@/hooks/useBarberos';
import { useVentas } from '@/hooks/useVentas';
import { PanelShell } from '../layout/PanelShell';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { DetailClose } from '../ui/DetailClose';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { PageHeader } from '../ui/PageHeader';
import { Select, Seg } from '../ui/Form';

const LEYENDA: [EstadoCita, string][] = [['atendida', 'Atendida'], ['encurso', 'En curso'], ['confirmada', 'Confirmada'], ['pendiente', 'Sin confirmar'], ['noasistio', 'No asistió'], ['cancelada', 'Cancelada']];

export function AgendaView() {
  const q = useSearchParams();
  const ag = useAgendaBoard(q.get('d'));
  const { agendables, porId } = useBarberos();
  const { ventas } = useVentas();
  const { toast, openSheet } = useUI();
  const detail = useRef<HTMLElement>(null);
  const [cancelar, setCancelar] = useState<Cita | null>(null);

  const k = diffDays(ag.dia, HOY);
  const activas = ag.citas.filter((c) => c.est !== 'cancelada').length;
  const pa = ag.citas.filter(porAtender).length;
  const lbl = (k === 0 ? 'Hoy · ' : k === 1 ? 'Mañana · ' : k === -1 ? 'Ayer · ' : '') + fLarga(ag.dia);

  const seleccionar = (id: string) => { ag.seleccionar(id); setTimeout(() => openSheet(detail.current), 0); };
  const marcar = async (c: Cita, est: EstadoCita) => { await ag.cambiarEstado(c.id, est); toast(c.cliente + ' quedó como “' + EST_CITA[est].txt + '”'); };

  /* ---------- Tablero por barbero ---------- */
  const [a, z] = ag.rango;
  const rows = (z - a) / 15;
  const row = (t: number) => (t - a) / 15 + 2;
  const board = (
    <div className="ag-grid" style={{ gridTemplateColumns: `58px repeat(${ag.cols.length},minmax(128px,1fr))`, gridTemplateRows: `56px repeat(${rows},18px)`, backgroundSize: `100% ${rows * 18}px,100% ${rows * 18}px`, minWidth: 58 + ag.cols.length * 140 }}>
      <div className="ag-head" />
      {ag.cols.map((b, i) => {
        const n = ag.lista.filter((c) => c.b === b.id).length;
        const sub = enVac(b, ag.dia) ? 'Vacaciones' : !rangosDe(b, ag.dia).length && !n ? 'Día libre' : plural(n, 'cita', 'citas');
        return [
          <div key={'h' + b.id} className="ag-colhead" style={{ gridColumn: i + 2 }}><Avatar id={b.id} className="av-sm" /><span><b>{b.corto}</b><small>{sub}</small></span></div>,
          <div key={'c' + b.id} className="ag-col" style={{ gridColumn: i + 2, gridRow: `2 / span ${rows}` }} />,
        ];
      })}
      {Array.from({ length: (z - a) / 60 }, (_, j) => a + j * 60).map((t) => (
        <span key={'t' + t} className="ag-hour" style={{ gridRow: `${row(t)} / span 4` }}>{horaH(t / 60)}</span>
      ))}
      {ag.cols.map((b, i) => ag.offBlocks(b).map((o, j) => (
        <div key={'o' + b.id + j} className={'ag-off' + (o.vac ? ' vac' : '')} style={{ gridColumn: i + 2, gridRow: `${row(o.ini)} / span ${Math.max(1, o.dur / 15)}` }}>{o.label}</div>
      )))}
      {ag.lista.map((c) => {
        const i = ag.cols.findIndex((b) => b.id === c.b);
        if (i < 0) return null;
        const span = Math.max(1, Math.round(c.dur / 15));
        return (
          <button key={c.id} type="button" className={'ag-block st-' + c.est + (span === 1 ? ' is-xs' : '')} style={{ gridColumn: i + 2, gridRow: `${row(c.ini)} / span ${span}` }}
            aria-pressed={c.id === ag.sel?.id} aria-label={c.cliente + ', ' + c.largo + ', ' + hora(c.ini) + ', ' + EST_CITA[c.est].txt} onClick={() => seleccionar(c.id)}>
            {span <= 2 ? <b>{c.cliente} · {c.paquete}</b> : <><b>{c.cliente}</b><small>{hora(c.ini).replace(/ [ap]\. m\.| m\./, '')} · {c.paquete}</small></>}
          </button>
        );
      })}
      {sameDay(ag.dia, HOY) && AHORA_DEMO > a && AHORA_DEMO < z && (
        <div className="ag-now" style={{ top: 56 + ((AHORA_DEMO - a) / 15) * 18 }}><span>Ahora · {hora(AHORA_DEMO)}</span></div>
      )}
    </div>
  );

  /* ---------- Lista ---------- */
  const ordenadas = ag.lista.slice().sort((p, r) => p.ini - r.ini || p.b.localeCompare(r.b));
  const vac = ag.cols.filter((b) => enVac(b, ag.dia));

  /* ---------- Detalle ---------- */
  const c = ag.sel;
  let det;
  if (!c) {
    det = <div className="dpanel-head"><span className="sheet-grip" /><h2 className="dpanel-title">Detalle de la cita</h2><p className="muted">Selecciona una cita de la agenda para ver sus datos y acciones.</p></div>;
  } else {
    const venta = ventas.find((v) => v.cliente === c.cliente && v.b === c.b);
    const abierta = porAtender(c);
    det = (
      <>
        <span className="sheet-grip" />
        <DetailClose />
        <div className="dpanel-head">
          <span><Badge cls={EST_CITA[c.est].cls}>{EST_CITA[c.est].txt}</Badge></span>
          <h2 className="dpanel-title">{c.cliente}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', fontSize: 13, color: 'var(--ink-2)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="phone" size={15} />+57 {c.tel}</span>
            <span>{c.hist}</span>
          </div>
        </div>
        <div className="dpanel-body rows">
          <div className="kv"><span>Servicio</span><span>{c.largo} · {c.dur} min</span></div>
          <div className="kv"><span>Barbero</span><span>{porId(c.b)?.nombre}</span></div>
          <div className="kv"><span>Horario</span><span>{cap(k === 0 ? 'hoy' : relDia(ag.dia))} · {hora(c.ini)} – {hora(c.ini + c.dur)}</span></div>
          <div className="kv"><span>Valor</span><span>{cop(c.precio)}</span></div>
          <div className="kv"><span>Origen</span><span>{c.origen}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' }}>
            <span className="muted" style={{ fontSize: 13 }}>Nota del cliente</span>
            {c.nota ? <span className="quote">“{c.nota}”</span> : <span className="muted">Sin nota.</span>}
          </div>
        </div>
        <div className="dpanel-actions detail-pad-b">
          {abierta ? (
            <>
              {k === 0 && <Link className="btn btn-gold btn-caps" href={'/admin/ventas?cita=' + c.id}><Icon name="receipt" size={18} />Atender y registrar venta</Link>}
              <div className="two">
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => toast('Elige el nuevo horario en el agendamiento. El cliente recibe el cambio por WhatsApp.', 'refresh')}>Reprogramar</button>
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => toast('Recordatorio enviado por WhatsApp al +57 ' + c.tel, 'wa')}>Recordar por WhatsApp</button>
                <button type="button" className="btn btn-quiet btn-sm" disabled={k > 0} onClick={() => marcar(c, 'noasistio')}>Marcar no asistió</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setCancelar(c)}>Cancelar cita</button>
              </div>
            </>
          ) : (
            <p className={'note' + (c.est === 'atendida' ? ' note-ok' : '')}>
              <Icon name={c.est === 'atendida' ? 'check' : 'info'} size={18} />
              <span>
                {c.est === 'atendida'
                  ? venta ? 'Venta #' + ticketTxt(venta.ticket) + ' registrada · ' + cop(venta.total) + ' · ' + metodoTxt(venta.metodo) : 'Servicio atendido y cobrado.'
                  : c.est === 'noasistio' ? 'Marcada como inasistencia. Cuenta para la regla de clientes que no asisten.' : 'Cita cancelada. El horario quedó libre para otros clientes.'}
              </span>
            </p>
          )}
        </div>
      </>
    );
  }

  return (
    <PanelShell rol="admin" active="agenda" tb={<Link className="btn btn-icon tb-btn" href="/agendar" aria-label="Nueva cita"><Icon name="plus" size={22} /></Link>}>
      <PageHeader eyebrow={plural(activas, 'cita', 'citas') + ' · ' + pa + ' por atender'} title="Agenda de citas" actions={<Link className="btn btn-gold" href="/agendar"><Icon name="plus" size={18} />Nueva cita</Link>} />

      <div className="ag-tools">
        <div className="datenav">
          <button type="button" className="btn btn-icon" aria-label="Día anterior" onClick={() => ag.moverDia(-1)}><Icon name="left" size={18} /></button>
          <span aria-live="polite">{cap(lbl)}</span>
          <button type="button" className="btn btn-icon" aria-label="Día siguiente" onClick={() => ag.moverDia(1)}><Icon name="right" size={18} /></button>
        </div>
        {k !== 0 && <button type="button" className="btn btn-quiet btn-sm" onClick={ag.irHoy}>Volver a hoy</button>}
        <Seg className="ag-viewseg" label="Vista" value={ag.vista} onChange={ag.setVista} options={[['dia', 'Día'], ['lista', 'Lista']]} />
        <label className="filter ag-barber-select">Barbero
          <Select options={[['todos', 'Todos los barberos'], ...agendables.map((b) => [b.id, b.nombre] as [string, string])]} value={ag.filtro} onChange={(e) => ag.setFiltro(e.target.value)} />
        </label>
        <div className="ag-legend" aria-hidden="true">
          {LEYENDA.map(([e, t]) => <span key={e} className={'st-' + e}><i style={{ background: 'var(--s-bg)', borderColor: 'var(--s-bd)', borderStyle: e === 'pendiente' ? 'dashed' : undefined }} />{t}</span>)}
        </div>
      </div>

      <div className="ag-layout">
        <div className="ag-wrap" data-view={ag.vista}>
          <section className="card ag-board" aria-label="Agenda del día por barbero">{board}</section>
          <section className="ag-list" aria-label="Lista de citas">
            <div className="chips-scroll" role="group" aria-label="Filtrar por barbero">
              {[['todos', 'Todos'] as [string, string], ...agendables.map((b) => [b.id, b.corto] as [string, string])].map(([id, t]) => (
                <button key={id} type="button" className="chip chip-pill" aria-pressed={ag.filtro === id} onClick={() => ag.setFiltro(id)}>{t}</button>
              ))}
            </div>
            {vac.length > 0 && <p className="note note-warn"><Icon name="calOff" size={18} /><span>{vac.map((b) => b.nombre + ' está de vacaciones hasta el ' + fDeMes(b.vac!.hasta)).join('. ')}.</span></p>}
            {ordenadas.length ? (
              <div className="ag-items">
                {ordenadas.map((x) => (
                  <button key={x.id} type="button" className={'ag-item st-' + x.est} aria-pressed={x.id === ag.sel?.id} onClick={() => seleccionar(x.id)}>
                    <span className="ag-item-time"><b>{hora(x.ini)}</b><small>{x.dur} min</small></span>
                    <span className="ag-item-body"><b>{x.cliente}</b><small>{x.largo} · {porId(x.b)?.corto}</small></span>
                    <span className="ag-sbadge">{EST_CITA[x.est].txt}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="card ag-empty">{ag.loading ? 'Cargando agenda…' : 'No hay citas para este día con el filtro elegido.'}</div>
            )}
          </section>
        </div>
        <aside className="card dpanel detail" id="detail" ref={detail} aria-label="Detalle de la cita">{det}</aside>
      </div>

      {cancelar && (
        <Modal title="Cancelar cita" size="sm" onClose={() => setCancelar(null)}
          foot={<>
            <button type="button" className="btn btn-quiet" onClick={() => setCancelar(null)}>Volver</button>
            <button type="button" className="btn btn-danger" onClick={async () => { const x = cancelar; setCancelar(null); await ag.cambiarEstado(x.id, 'cancelada'); toast('Cita cancelada. Le avisamos a ' + x.cliente.split(' ')[0] + ' por WhatsApp.'); }}>Sí, cancelar cita</button>
          </>}>
          <p>¿Cancelar la cita de <b className="strong">{cancelar.cliente}</b> ({cancelar.largo}, {hora(cancelar.ini)})?</p>
          <label className="field">Motivo<Select options={['El cliente pidió cancelar', 'El barbero no puede atender', 'Otro motivo']} defaultValue="El cliente pidió cancelar" /></label>
          <label className="check"><input type="checkbox" defaultChecked />Avisar al cliente por WhatsApp</label>
        </Modal>
      )}
    </PanelShell>
  );
}
