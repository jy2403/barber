'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { DIAS_ED_C } from '@/lib/constants';
import { AHORA_DEMO, DIAS, HOY, MESES, addDays, cap, cop, copM, fDeMes, fLargaA, hora, horaH, pct, plural } from '@/lib/format';
import { useData } from '@/context/DataContext';
import { useAgendaDia } from '@/hooks/useAgenda';
import { useBarberos } from '@/hooks/useBarberos';
import { useVentas } from '@/hooks/useVentas';
import { PanelShell } from '../layout/PanelShell';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { PageHeader } from '../ui/PageHeader';
import { LineChart, Sparkline } from '../shared/LineChart';

const V25 = [410, 395, 440, 452, 480, 470, 505, 498, 476, 512, 540, 610];
const V26 = [520, 498, 560, 575, 602, 590, 640, 655, 618, 668];
const MES_LBL = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const RAMP = ['#26231d', '#4a3d27', '#7a6132', '#b08b47', '#e6c77f'];

function Kpi({ label, value, delta, cls = '' }: { label: string; value: ReactNode; delta: ReactNode; cls?: string }) {
  return <div className="kpi"><span className="kpi-label">{label}</span><span className="kpi-value num">{value}</span><span className={'kpi-delta ' + cls}>{delta}</span></div>;
}

/** Aviso de citas de mañana sin confirmar */
function PendMan() {
  const { citas } = useAgendaDia(addDays(HOY, 1));
  const n = citas.filter((c) => c.est === 'pendiente').length;
  return n ? <><strong>{plural(n, 'cita de mañana', 'citas de mañana')}</strong> {n === 1 ? 'sigue' : 'siguen'} sin confirmar por WhatsApp.</> : <>Todas las citas de mañana están <strong>confirmadas</strong>.</>;
}

export function DashboardView() {
  const { agendaHoy, bloqueos, servicios } = useData();
  const { agendables, porId } = useBarberos();
  const { caja } = useVentas();
  const [notif, setNotif] = useState(false);

  const cj = caja();
  const dow = DIAS[HOY.getDay()];
  const ticket = cj.clientes ? Math.round(cj.total / cj.clientes / 100) * 100 : 0;

  const ocupacion = (bid: string) => {
    const cs = agendaHoy.filter((c) => c.b === bid && c.est !== 'cancelada');
    if (!cs.length) return 0;
    const a = Math.min(...cs.map((c) => c.ini));
    const z = Math.max(...cs.map((c) => c.ini + c.dur));
    const bloq = bloqueos.filter((x) => x.b === bid && x.ini >= a && x.ini < z).reduce((s, x) => s + x.dur, 0);
    return Math.min(1, cs.reduce((s, c) => s + c.dur, 0) / Math.max(1, z - a - bloq));
  };
  const occ = agendables.filter((b) => b.estado === 'activo').map((b) => ocupacion(b.id));
  const occProm = occ.reduce((a, b) => a + b, 0) / Math.max(1, occ.length);

  const cnt = { atendida: 0, encurso: 0, prox: 0, noasistio: 0, cancelada: 0 };
  agendaHoy.forEach((c) => { if (c.est === 'confirmada' || c.est === 'pendiente') cnt.prox++; else cnt[c.est]++; });
  const segs: [string, number, string][] = [['Atendidas', cnt.atendida, 'var(--ok)'], ['En curso', cnt.encurso, 'var(--gold)'], ['Próximas', cnt.prox, 'var(--info)'], ['No asistió', cnt.noasistio, 'var(--bad)'], ['Canceladas', cnt.cancelada, '#5b5850']];
  const prox = agendaHoy.filter((c) => (c.est === 'confirmada' || c.est === 'pendiente') && c.ini >= AHORA_DEMO).sort((a, z) => a.ini - z.ini).slice(0, 4);

  const brutoMes = servicios.reduce((s, x) => s + x.ingresos, 0);
  const maxI = Math.max(...servicios.map((x) => x.ingresos));

  // Mapa de calor
  const mult = [0.62, 0.7, 0.76, 0.86, 1.16, 1.36, 0.55];
  const base = [1.2, 1.8, 2.6, 3.1, 2.4, 2.2, 2.7, 3.6, 4.2, 4.6, 3.9];
  const dl = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados', 'Domingos'];
  const heat = [<span key="h" />, ...[9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7].map((h) => <span key={'hl' + h} className="hl">{h}</span>)];
  DIAS_ED_C.forEach((d, r) => {
    heat.push(<span key={'hd' + r} className="hd">{d}</span>);
    base.forEach((bv, c) => {
      if (r === 6 && (c < 1 || c > 5)) { heat.push(<span key={r + '-' + c} className="hc" style={{ background: '#111112' }} title={dl[r] + ' ' + horaH(9 + c) + ': cerrado'} />); return; }
      const v = bv * mult[r];
      const k = v < 1.4 ? 0 : v < 2.2 ? 1 : v < 3 ? 2 : v < 4 ? 3 : 4;
      heat.push(<span key={r + '-' + c} className="hc" style={{ background: RAMP[k] }} title={dl[r] + ' ' + horaH(9 + c) + ': ' + v.toFixed(1).replace('.', ',') + ' clientes en promedio'} />);
    });
  });

  const andres = porId('andres');
  const bell = <button type="button" className="btn btn-icon tb-btn" onClick={() => setNotif(true)} aria-label="Notificaciones (3 nuevas)"><Icon name="bell" size={20} /></button>;

  return (
    <PanelShell rol="admin" active="dashboard" tb={bell}>
      <PageHeader
        eyebrow={cap(fLargaA(HOY))}
        title="Dashboard"
        actions={<>
          <button type="button" className="btn btn-icon btn-quiet ph-desk" onClick={() => setNotif(true)} aria-label="Notificaciones (3 nuevas)"><Icon name="bell" size={20} /></button>
          <Link className="btn btn-quiet" href="/admin/agenda"><Icon name="cal" size={18} />Ver agenda</Link>
          <Link className="btn btn-gold" href="/admin/ventas"><Icon name="receipt" size={18} />Registrar venta</Link>
        </>}
      />

      <section className="kpis" aria-label="Indicadores del día">
        <div className="kpi kpi-hero">
          <span className="kpi-label">Ventas del día · hasta {hora(AHORA_DEMO)}</span>
          <div className="kpi-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="kpi-value num">{cop(cj.total)}</span>
              <span className="kpi-delta up"><Icon name="up" size={14} />+12 % <span>vs. {dow} pasado a esta hora</span></span>
            </div>
            <Sparkline vals={[980, 1120, 1340, 1610, 720, 890, 1050, 1110, 1290, 1580, 1720, Math.round(cj.total / 1000)]} />
          </div>
        </div>
        <Kpi label="Clientes atendidos" value={cj.clientes} delta={<><Icon name="up" size={14} />+4 <span>vs. {dow} pasado</span></>} cls="up" />
        <Kpi label="Servicios realizados" value={cj.servicios} delta={<><Icon name="up" size={14} />+5 <span>vs. {dow} pasado</span></>} cls="up" />
        <Kpi label="Ticket promedio" value={cop(ticket)} delta={<><Icon name="dn" size={14} />−5 % <span>vs. {dow} pasado</span></>} cls="down" />
        <Kpi label="Propinas del día" value={cop(cj.propinas)} delta={<span>Van 100 % a los barberos</span>} />
      </section>

      <div className="dgrid">
        <section className="card card-pad a-perf" aria-labelledby="t-perf">
          <div className="card-head">
            <h2 className="card-title" id="t-perf">Rendimiento por barbero · hoy</h2>
            <Link className="link" href="/admin/reportes?t=detallado">Ver reporte detallado<Icon name="arrow" size={16} /></Link>
          </div>
          <div className="perf">
            <div className="perf-row perf-head"><span>Barbero</span><span className="r">Servicios</span><span className="r">Clientes</span><span className="r">Ventas</span><span className="r">Propinas</span><span>Ocupación</span></div>
            {agendables.map((b) => {
              if (b.estado !== 'activo') {
                return (
                  <div className="perf-row" key={b.id}>
                    <span className="perf-who"><Avatar id={b.id} className="av-sm" /><span>{b.nombre}</span></span>
                    <span className="perf-away"><span className="badge b-warn"><Icon name="calOff" size={14} />De vacaciones hasta el {b.vac ? fDeMes(b.vac.hasta) : '—'}</span></span>
                  </div>
                );
              }
              const c = caja(b.id);
              const o = ocupacion(b.id);
              return (
                <div className="perf-row" key={b.id}>
                  <span className="perf-who"><Avatar id={b.id} className="av-sm" /><span>{b.nombre}</span></span>
                  <span className="perf-srv r"><span className="m-label">Servicios</span>{c.servicios}</span>
                  <span className="perf-cli r"><span className="m-label">Clientes</span>{c.clientes}</span>
                  <span className="perf-sales r">{cop(c.total)}</span>
                  <span className="perf-tip r"><span className="m-label">Propinas</span>{cop(c.propinas)}</span>
                  <span className="perf-occ"><span className="occ"><span className="occ-bar"><span style={{ width: Math.round(o * 100) + '%' }} /></span><b>{Math.round(o * 100)} %</b></span></span>
                </div>
              );
            })}
            <div className="perf-row perf-total">
              <span className="perf-who">Total del día</span>
              <span className="perf-srv r"><span className="m-label">Servicios</span>{cj.servicios}</span>
              <span className="perf-cli r"><span className="m-label">Clientes</span>{cj.clientes}</span>
              <span className="perf-sales r">{cop(cj.total)}</span>
              <span className="perf-tip r"><span className="m-label">Propinas</span>{cop(cj.propinas)}</span>
              <span className="perf-occ">{Math.round(occProm * 100)} % promedio</span>
            </div>
          </div>
        </section>

        <section className="card card-pad a-citas" aria-labelledby="t-citas">
          <div className="card-head">
            <h2 className="card-title" id="t-citas">Citas de hoy</h2>
            <span className="badge b-gold" style={{ fontSize: 13 }}>{agendaHoy.length} en total</span>
          </div>
          <div className="stackbar" role="img" aria-label={segs.map((s) => s[1] + ' ' + s[0].toLowerCase()).join(', ')}>
            {segs.filter((s) => s[1]).map((s) => <span key={s[0]} style={{ flex: s[1], background: s[2] }} />)}
          </div>
          <div className="legend-grid" style={{ marginTop: 14 }}>
            {segs.map((s) => <span className="lg" key={s[0]}><i style={{ background: s[2] }} />{s[0]}<b>{s[1]}</b></span>)}
          </div>
          <div className="next-list" style={{ marginTop: 18 }}>
            <span className="label-caps" style={{ paddingBottom: 6 }}>Próximas</span>
            {prox.map((c) => (
              <div className="next-row" key={c.id}><b>{hora(c.ini)}</b><span><strong>{c.cliente}</strong><small>{c.largo} · {porId(c.b)?.corto}</small></span></div>
            ))}
          </div>
          <Link className="link" href="/admin/agenda">Ver agenda completa<Icon name="arrow" size={16} /></Link>
        </section>

        <section className="card card-pad a-line" aria-labelledby="t-mes">
          <div className="card-head">
            <div><h2 className="card-title" id="t-mes">Clientes atendidos por mes</h2><span className="card-sub">2026 frente a 2025 · de enero a octubre</span></div>
            <div className="legend">
              <span><i style={{ background: '#e0c27f' }} />2026</span>
              <span><i style={{ background: 'repeating-linear-gradient(90deg,#8f897e 0 5px,transparent 5px 9px)' }} />2025</span>
            </div>
          </div>
          <LineChart
            labels={MES_LBL}
            aria="Clientes atendidos por mes. Octubre de 2026: 668, frente a 512 en octubre de 2025."
            series={[{ name: '2025', color: '#8f897e', data: V25, dash: true }, { name: '2026', color: '#e0c27f', data: V26 }]}
            tip={(i) => {
              const has = i < V26.length;
              const p = has ? ((V26[i] - V25[i]) / V25[i]) * 100 : 0;
              return (
                <>
                  <b>{cap(MESES[i])}</b>
                  <span><i style={{ background: '#e0c27f' }} /><strong>{has ? V26[i] : '—'}</strong> 2026</span>
                  <span><i style={{ background: '#8f897e' }} /><strong>{V25[i]}</strong> 2025</span>
                  {has ? <em className={p >= 0 ? 'up' : 'down'}>{(p >= 0 ? '+' : '−') + pct(Math.abs(p), 1)} vs. 2025</em> : <em style={{ color: 'var(--ink-3)' }}>Sin datos de 2026 aún</em>}
                </>
              );
            }}
          />
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Pasa el cursor o desliza el dedo sobre la gráfica para ver cada mes.</p>
        </section>

        <section className="card card-pad a-svc" aria-labelledby="t-svc">
          <div className="card-head"><h2 className="card-title" id="t-svc">Ventas por servicio</h2><span className="card-sub">Octubre 2026 · total {copM(brutoMes)}</span></div>
          <div className="hbars">
            {servicios.filter((x) => x.ingresos).sort((a, z) => z.ingresos - a.ingresos).map((x) => (
              <div className="hbar" key={x.id}>
                <div className="hbar-top"><span>{x.nombre}</span><span>{Math.round((x.ingresos / brutoMes) * 100)} %</span></div>
                <div className="hbar-row"><span className="hbar-fill" style={{ width: 'calc((100% - 74px) * ' + (x.ingresos / maxI).toFixed(3) + ')' }} /><span className="hbar-val">{copM(x.ingresos)}</span></div>
              </div>
            ))}
          </div>
        </section>

        <section className="card card-pad a-heat" aria-labelledby="t-heat">
          <div className="card-head">
            <div><h2 className="card-title" id="t-heat">Horas pico</h2><span className="card-sub">Clientes promedio por hora · últimas 4 semanas</span></div>
            <div className="heat-legend" aria-hidden="true">Menos{RAMP.map((c) => <i key={c} style={{ background: c }} />)}Más</div>
          </div>
          <div className="heat" role="img" aria-label="Mapa de calor: la mayor afluencia es el viernes y el sábado entre las 4 y las 7 de la tarde.">{heat}</div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>Horas de 9 a. m. a 7 p. m. Los domingos se atiende de 10 a. m. a 3 p. m.</p>
        </section>

        <section className="card card-pad a-cli" aria-labelledby="t-cli">
          <div className="card-head"><h2 className="card-title" id="t-cli">Clientes de octubre</h2></div>
          <div className="mini3"><div><span>Nuevos</span><b>96</b></div><div><span>Recurrentes</span><b>572</b></div><div><span>Retorno</span><b>71 %</b></div></div>
          <div className="alerts" style={{ marginTop: 18 }}>
            <span className="label-caps" style={{ paddingBottom: 8 }}>Para tener en cuenta</span>
            <div className="alert warn"><Icon name="bell" size={18} /><span><PendMan /></span></div>
            <div className="alert"><Icon name="gift" size={18} /><span><strong>3 clientes</strong> cumplen años esta semana.</span></div>
            <div className="alert"><Icon name="userX" size={18} /><span><strong>212 clientes</strong> llevan más de 60 días sin volver. <Link href="/admin/clientes?seg=inactivo">Ver lista</Link></span></div>
          </div>
        </section>
      </div>

      {notif && (
        <Modal title="Notificaciones" size="sm" onClose={() => setNotif(false)}
          foot={<><button type="button" className="btn btn-quiet" onClick={() => setNotif(false)}>Cerrar</button><Link className="btn btn-gold" href="/admin/agenda">Ir a la agenda</Link></>}>
          <div className="alerts">
            <div className="alert warn" style={{ borderTop: 0 }}><Icon name="bell" size={18} /><span><PendMan /></span></div>
            <div className="alert"><Icon name="gift" size={18} /><span><strong>3 clientes</strong> cumplen años esta semana.</span></div>
            {andres?.vac && <div className="alert"><Icon name="calOff" size={18} /><span><strong>{andres.nombre}</strong> está de vacaciones hasta el {fDeMes(andres.vac.hasta)}.</span></div>}
          </div>
        </Modal>
      )}
    </PanelShell>
  );
}
