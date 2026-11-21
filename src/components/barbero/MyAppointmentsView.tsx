'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Cita } from '@/types';
import { EST_CITA, NEGOCIO, YO } from '@/lib/constants';
import { HOY, addDays, cap, cop, diffDays, durTxt, fLarga, hora, plural, sameDay } from '@/lib/format';
import { esFestivo, rangosDe } from '@/lib/domain/availability';
import { porAtender } from '@/lib/domain/sales';
import { useUI } from '@/context/UIContext';
import { useAgendaDia, useAgendaRango } from '@/hooks/useAgenda';
import { useBarberos } from '@/hooks/useBarberos';
import { useVentas } from '@/hooks/useVentas';
import { PanelShell } from '../layout/PanelShell';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Seg } from '../ui/Form';
import { MiniKpi } from '../ui/PageHeader';

type Tab = 'hoy' | 'manana' | 'semana';

function CitaCard({ c, d, onNoShow }: { c: Cita; d: Date; onNoShow: (c: Cita) => void }) {
  const { ventas } = useVentas();
  const { toast } = useUI();
  const hoy = sameDay(d, HOY);
  const cerrada = !porAtender(c);
  const venta = ventas.find((v) => v.cliente === c.cliente && v.b === c.b);
  const ok = c.est === 'atendida';
  return (
    <article className={'cita' + (c.est === 'encurso' ? ' is-now' : '') + (cerrada ? ' is-done' : '')}>
      <div className="cita-time"><b>{hora(c.ini)}</b><small>{c.dur} min</small></div>
      <div className="cita-body">
        <div className="cita-name"><b>{c.cliente}</b><Badge cls={EST_CITA[c.est].cls}>{EST_CITA[c.est].txt}</Badge></div>
        <span>{c.largo} · <strong>{cop(c.precio)}</strong></span>
        <small><Icon name="phone" size={14} />{c.tel} · {c.hist}</small>
        {c.nota && <span className="quote">“{c.nota}”</span>}
      </div>
      <div className="cita-acts">
        {cerrada ? (
          <span className="cita-closed" style={{ color: ok ? 'var(--ok)' : 'var(--bad)' }}>
            <Icon name={ok ? 'check' : 'x'} size={18} />
            {ok ? (hoy ? 'Venta registrada' + (venta ? ' · ' + cop(venta.total) : '') : 'Atendida') : c.est === 'cancelada' ? 'Cita cancelada' : 'Marcada como inasistencia'}
          </span>
        ) : (
          <>
            {hoy && <Link className="btn btn-gold btn-sm" href={'/barbero/ventas?cita=' + c.id}><Icon name="receipt" size={16} />{c.est === 'encurso' ? 'Terminar y registrar venta' : 'Atender y registrar venta'}</Link>}
            <div className="two">
              <a className="btn btn-quiet btn-sm" href={NEGOCIO.waLink} target="_blank" rel="noopener"><Icon name="wa" size={16} />WhatsApp</a>
              {hoy
                ? <button type="button" className="btn btn-quiet btn-sm" onClick={() => onNoShow(c)}>No asistió</button>
                : <button type="button" className="btn btn-quiet btn-sm" onClick={() => toast('Recordatorio enviado a ' + c.cliente, 'bell')}>Recordar</button>}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export function MyAppointmentsView() {
  const { toast } = useUI();
  const { porId } = useBarberos();
  const yo = porId(YO)!;
  const [tab, setTab] = useState<Tab>('hoy');
  const [noShow, setNoShow] = useState<Cita | null>(null);
  const { citas: agendaHoy, cambiarEstado } = useAgendaDia(HOY);
  const rango = useAgendaRango(addDays(HOY, 1), 7);

  const mias = (d: Date) => rango.get(d).filter((c) => c.b === YO).sort((a, z) => a.ini - z.ini);
  const hoy = agendaHoy.filter((c) => c.b === YO).sort((a, z) => a.ini - z.ini);
  const man = addDays(HOY, 1);
  const lm = mias(man);
  const sem: [Date, Cita[]][] = Array.from({ length: 7 }, (_, k) => { const d = addDays(HOY, k + 1); return [d, mias(d)]; });
  const nSem = sem.reduce((s, x) => s + x[1].filter((c) => c.est !== 'cancelada').length, 0);
  const count = (l: Cita[], f: (c: Cita) => boolean) => l.filter(f).length;

  let kpis;
  let body;
  if (tab === 'hoy') {
    kpis = <><MiniKpi label="Citas de hoy" value={hoy.length} color="var(--gold)" /><MiniKpi label="Atendidas" value={count(hoy, (c) => c.est === 'atendida')} color="var(--ok)" /><MiniKpi label="Por atender" value={count(hoy, porAtender)} color="var(--info)" /><MiniKpi label="No asistió" value={count(hoy, (c) => c.est === 'noasistio')} color="var(--bad)" /></>;
    body = (
      <section className="stack-v" aria-label="Citas de hoy">
        <h2 className="day-h">Hoy · {fLarga(HOY)}</h2>
        {hoy.length ? hoy.map((c) => <CitaCard key={c.id} c={c} d={HOY} onNoShow={setNoShow} />) : <div className="card ag-empty">No tienes citas hoy.</div>}
      </section>
    );
  } else if (tab === 'manana') {
    const rs = rangosDe(yo, man);
    const libre = rs.reduce((s, r) => s + r[1] - r[0], 0) - lm.reduce((s, c) => s + c.dur, 0);
    kpis = <><MiniKpi label="Citas de mañana" value={lm.length} color="var(--gold)" /><MiniKpi label="Confirmadas" value={count(lm, (c) => c.est === 'confirmada')} color="var(--ok)" /><MiniKpi label="Sin confirmar" value={count(lm, (c) => c.est === 'pendiente')} color="var(--info)" /><MiniKpi label="Tiempo libre" value={rs.length ? durTxt(Math.max(0, libre)) : '—'} color="var(--ink-4)" /></>;
    body = (
      <section className="stack-v" aria-label="Citas de mañana">
        <h2 className="day-h">Mañana · {fLarga(man)}{esFestivo(man) ? ' · festivo' : ''}</h2>
        {lm.length ? lm.map((c) => <CitaCard key={c.id} c={c} d={man} onNoShow={setNoShow} />) : <div className="card ag-empty">{rs.length ? 'Aún no tienes citas para mañana.' : 'Mañana es tu día libre.'}</div>}
      </section>
    );
  } else {
    const llenos = sem.filter((x) => yo.lleno.includes(diffDays(x[0], HOY))).length;
    const todas = sem.flatMap((x) => x[1]);
    kpis = <><MiniKpi label="Próximos 7 días" value={nSem} color="var(--gold)" /><MiniKpi label="Confirmadas" value={count(todas, (c) => c.est === 'confirmada')} color="var(--ok)" /><MiniKpi label="Sin confirmar" value={count(todas, (c) => c.est === 'pendiente')} color="var(--info)" /><MiniKpi label="Días con agenda llena" value={llenos} color="var(--warn)" /></>;
    body = sem.map(([d, l]) => {
      const lleno = yo.lleno.includes(diffDays(d, HOY));
      const libre = !rangosDe(yo, d).length;
      const tit = cap(fLarga(d)) + ' · ' + (libre ? 'día libre' : plural(l.length, 'cita', 'citas')) + (lleno ? ' · agenda llena' : '') + (esFestivo(d) ? ' · festivo' : '');
      return (
        <section className="stack-v" aria-label={tit} key={tit}>
          <h2 className="day-h">{tit}</h2>
          {libre ? <div className="card ag-empty">No trabajas este día.</div> : (
            <>
              {l.slice(0, 2).map((c) => <CitaCard key={c.id} c={c} d={d} onNoShow={setNoShow} />)}
              {l.length > 2 && <p className="muted" style={{ fontSize: 13 }}>y {plural(l.length - 2, 'cita más', 'citas más')} ese día.</p>}
            </>
          )}
        </section>
      );
    });
  }

  return (
    <PanelShell rol="barbero" active="citas">
      <div className="ph">
        <div className="ph-text"><span className="ph-eyebrow">Hola, Santiago</span><h1 className="ph-title">Mis citas</h1></div>
        <div className="ph-actions">
          <Seg role="tablist" label="Periodo" value={tab} onChange={setTab} options={[['hoy', 'Hoy · ' + hoy.length], ['manana', 'Mañana · ' + lm.length], ['semana', 'Próximos 7 días · ' + nSem]]} />
        </div>
      </div>
      <div className="mini-kpis">{kpis}</div>
      {body}

      {noShow && (
        <Modal title="Marcar inasistencia" size="sm" onClose={() => setNoShow(null)}
          foot={<>
            <button type="button" className="btn btn-quiet" onClick={() => setNoShow(null)}>Volver</button>
            <button type="button" className="btn btn-danger" onClick={async () => { const c = noShow; setNoShow(null); await cambiarEstado(c.id, 'noasistio'); toast(c.cliente + ' quedó como inasistencia'); }}>Sí, no asistió</button>
          </>}>
          <p>¿{noShow.cliente} no llegó a su cita de las {hora(noShow.ini)}?</p>
          <p className="muted" style={{ fontSize: 13 }}>Queda en su historial. Después de 2 inasistencias, la barbería le pedirá confirmar por llamada.</p>
        </Modal>
      )}
    </PanelShell>
  );
}
