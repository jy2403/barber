'use client';
/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from 'react';
import type { Periodo, PeriodoParams, ReporteCalc } from '@/types';
import { EMBLEMA } from '@/lib/assets';
import { EST_B, METODOS, NEGOCIO, metodoTxt } from '@/lib/constants';
import { HOY, addDays, cop, copM, fDMA, generado, hora, iso, miles, pad } from '@/lib/format';
import { RBASE } from '@/lib/domain/reports';
import { useData } from '@/context/DataContext';
import { Avatar } from '../../ui/Avatar';
import { Icon } from '../../ui/Icon';
import { Seg, Select } from '../../ui/Form';

/* ---------- Hoja del reporte ---------- */
function Paper({ sub, per, pages, footL, children }: { sub: string; per: Periodo; pages: number; footL?: string; children: ReactNode }) {
  return (
    <article className="paper" aria-label={'Vista previa del reporte en PDF: ' + sub}>
      <header className="paper-head">
        <div className="paper-brand"><img src={EMBLEMA} alt="" /><span><b>AURUM BARBER CLUB</b><small>{sub}</small></span></div>
        <div className="paper-meta"><span>Periodo: <b>{per.label}</b></span><span>Generado el {generado()}</span></div>
      </header>
      <div className="paper-body">{children}</div>
      <footer className="paper-foot">
        <span>{footL || 'AURUM Barber Club · NIT ' + NEGOCIO.nit + ' · Documento generado por el sistema'}</span>
        <span>Página 1 de {pages}</span>
      </footer>
    </article>
  );
}

function PKpis({ list }: { list: [string, string, string?][] }) {
  return (
    <div className="p-kpis">
      {list.map(([l, v, c]) => <div key={l}><span>{l}</span><b style={c ? { color: c } : undefined}>{v}</b></div>)}
    </div>
  );
}

/* ---------- Resumen ---------- */
export function ResumenReport({ per, r }: { per: Periodo; r: ReporteCalc }) {
  const { servicios, barberos } = useData();
  const maxW = Math.max(...r.semanas.map((s) => s.v), 1);
  const tc = r.netas * NEGOCIO.comision;
  const svs = servicios.filter((s) => r.svc[s.id] !== undefined).sort((a, z) => r.svc[z.id] * z.precio - r.svc[a.id] * a.precio);
  return (
    <Paper sub="Resumen de ventas y servicios" per={per} pages={2}>
      <PKpis list={[['Ventas netas', cop(r.netas), '#8a6a2e'], ['Servicios', miles(r.servicios)], ['Clientes', miles(r.clientes)], ['Ticket promedio', cop(r.ticket)], ['Descuentos', '−' + cop(r.desc), '#a23e2c'], ['Propinas', cop(r.propinas), '#2e6b3d']]} />
      <section className="p-sec">
        <h3 className="p-h3">Ventas netas por semana</h3>
        <div className="p-bars" role="img" aria-label="Ventas netas por semana">
          {r.semanas.map((s, i) => <div key={i}><b>{copM(s.v)}</b><i style={{ height: Math.max(2, (s.v / maxW) * 110).toFixed(0) + 'px' }} /></div>)}
        </div>
        <div className="p-bars-x">{r.semanas.map((s, i) => <span key={i}>{s.label}</span>)}</div>
      </section>
      <div className="p-two">
        <section className="p-sec">
          <h3 className="p-h3">Por servicio</h3>
          <table className="ptable">
            <thead><tr><th>Servicio</th><th className="r">Cant.</th><th className="r">Ventas</th><th className="r">%</th></tr></thead>
            <tbody>
              {svs.map((s) => {
                const v = r.svc[s.id] * s.precio;
                return <tr key={s.id}><td>{s.nombre}</td><td className="r">{r.svc[s.id]}</td><td className="r">{cop(v)}</td><td className="r">{r.bruto ? Math.round((v / r.bruto) * 100) : 0}</td></tr>;
              })}
              <tr className="tot"><td>Total bruto</td><td className="r">{r.servicios}</td><td className="r">{cop(r.bruto)}</td><td className="r">100</td></tr>
            </tbody>
          </table>
        </section>
        <section className="p-sec">
          <h3 className="p-h3">Por método de pago</h3>
          <table className="ptable">
            <thead><tr><th>Método</th><th className="r">Valor</th><th className="r">%</th></tr></thead>
            <tbody>
              {r.metodos.map(([m, v]) => <tr key={m}><td>{metodoTxt(m)}</td><td className="r">{cop(v)}</td><td className="r">{r.netas ? Math.round((v / r.netas) * 100) : 0}</td></tr>)}
              <tr className="tot"><td>Total neto</td><td className="r">{cop(r.netas)}</td><td className="r">100</td></tr>
            </tbody>
          </table>
        </section>
      </div>
      <section className="p-sec">
        <h3 className="p-h3">Por barbero</h3>
        <div className="p-scroll">
          <table className="ptable wide">
            <thead><tr><th>Barbero</th><th className="r">Servicios</th><th className="r">Ventas netas</th><th className="r">Comisión</th><th className="r">Propinas</th><th className="r">A pagar</th></tr></thead>
            <tbody>
              {RBASE.barberos.filter((id) => r.barberos[id]).map((id) => {
                const x = r.barberos[id];
                return (
                  <tr key={id}>
                    <td className="b">{barberos.find((b) => b.id === id)?.nombre}{x.vacNota && <span style={{ color: '#6e675b', fontWeight: 400 }}> ({x.vacNota})</span>}</td>
                    <td className="r">{x.serv}</td><td className="r">{cop(x.netas)}</td><td className="r">{cop(x.com)}</td><td className="r">{cop(x.prop)}</td><td className="r b">{cop(x.pagar)}</td>
                  </tr>
                );
              })}
              <tr className="tot"><td>Total</td><td className="r">{r.servicios}</td><td className="r">{cop(r.netas)}</td><td className="r">{cop(tc)}</td><td className="r">{cop(r.propinas)}</td><td className="r">{cop(tc + r.propinas)}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </Paper>
  );
}

/* ---------- Detallado por barbero ---------- */
export function DetalladoReport({ per, r, bid, vista }: { per: Periodo; r: ReporteCalc; bid: string; vista: 'admin' | 'barbero' }) {
  const { servicios, barberos, agendaHoy } = useData();
  const todos = bid === 'todos';
  const id = todos ? 'santiago' : bid;
  const b = barberos.find((x) => x.id === id);
  const x = r.barberos[id];
  if (!b || !x) return null;
  const SV = (sid: string) => servicios.find((s) => s.id === sid)!;
  const filas = Object.keys(x.cells).sort((a, z) => x.cells[z] * SV(z).precio - x.cells[a] * SV(a).precio);
  const pool = agendaHoy.filter((c) => c.b === id && c.est !== 'cancelada' && c.est !== 'noasistio');
  const src = pool.length ? pool : agendaHoy.slice(0, 8);
  const ventas = [];
  for (let k = 0; k < Math.min(8, x.cli) && src.length; k++) {
    const c = src[(k * 3) % src.length];
    const d = addDays(per.hasta, -Math.floor(k / 3));
    const t = [1065, 980, 860, 700, 610][k % 5] + (k % 2) * 25;
    const desc = k % 4 === 1 ? Math.round(c.precio * 0.1) : 0;
    const prop = [5000, 2000, 0, 5000, 3000, 0, 2000, 0][k];
    ventas.push(
      <tr key={k}>
        <td>{pad(d.getDate())}/{pad(d.getMonth() + 1)} · {hora(t)}</td>
        <td>{k === 7 ? 'Cliente ocasional' : c.cliente}</td>
        <td>{c.largo}</td>
        <td className="r">{cop(c.precio)}</td>
        <td className={'r' + (desc ? ' neg' : '')}>{desc ? '−' + cop(desc) : '—'}</td>
        <td className={'r' + (prop ? ' pos' : '')}>{prop ? cop(prop) : '—'}</td>
        <td>{metodoTxt(METODOS[(k * 2) % 5][0])}</td>
      </tr>,
    );
  }
  return (
    <Paper sub="Reporte detallado de ventas y servicios por barbero" per={per} pages={Math.max(1, Math.ceil(x.cli / 40))}>
      {todos && <p className="p-callout"><b>Se generará un reporte por barbero ({RBASE.barberos.length} en total).</b><span>Esta vista previa muestra el primero.</span></p>}
      <div className="p-person">
        <Avatar id={id} />
        <span className="p-person-text">
          <b>{b.nombre}</b>
          <small>{b.tipoDoc} {b.doc} · Ingreso: {fDMA(b.ingreso)} · Prestación de servicios · Comisión {NEGOCIO.comision * 100} %</small>
        </span>
        <span className="p-badge">{EST_B[b.estado].txt}</span>
      </div>
      <PKpis list={[['Servicios', miles(x.serv)], ['Clientes atendidos', miles(x.cli)], ['Ventas brutas', cop(x.bruto)], ['Descuentos', '−' + cop(x.desc), '#a23e2c'], ['Ventas netas', cop(x.netas), '#8a6a2e'], ['Propinas', cop(x.prop), '#2e6b3d']]} />
      <div className="p-two">
        <section className="p-sec">
          <h3 className="p-h3">Servicios realizados</h3>
          <table className="ptable">
            <thead><tr><th>Servicio</th><th className="r">Cant.</th><th className="r">Total</th></tr></thead>
            <tbody>
              {filas.map((sid) => <tr key={sid}><td>{SV(sid).nombre}</td><td className="r">{x.cells[sid]}</td><td className="r">{cop(x.cells[sid] * SV(sid).precio)}</td></tr>)}
              <tr className="tot"><td>Total</td><td className="r">{x.serv}</td><td className="r">{cop(x.bruto)}</td></tr>
            </tbody>
          </table>
        </section>
        <section className="p-liq">
          <h3 className="p-h3">{vista === 'barbero' ? 'Mi liquidación del periodo' : 'Liquidación del barbero'}</h3>
          <div><span>Ventas netas del periodo</span><span className="num">{cop(x.netas)}</span></div>
          <div><span>Comisión del barbero ({NEGOCIO.comision * 100} %)</span><span className="num">{cop(x.com)}</span></div>
          <div><span>Propinas recibidas</span><span className="num">+{cop(x.prop)}</span></div>
          <div><span>Total a pagar</span><b>{cop(x.pagar)}</b></div>
        </section>
      </div>
      <section className="p-sec">
        <h3 className="p-h3">Detalle de ventas</h3>
        <div className="p-scroll">
          <table className="ptable wide">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Servicios</th><th className="r">Valor</th><th className="r">Desc.</th><th className="r">Propina</th><th>Pago</th></tr></thead>
            <tbody>{ventas.length ? ventas : <tr><td colSpan={7}>Sin ventas en el periodo.</td></tr>}</tbody>
          </table>
        </div>
        <span style={{ fontSize: 12, color: '#6e675b' }}>Mostrando {Math.min(8, x.cli)} de {x.cli} ventas del periodo. El PDF incluye el listado completo.</span>
      </section>
    </Paper>
  );
}

/* ---------- Clientes ---------- */
export function ClientesReport({ per, r }: { per: Periodo; r: ReporteCalc }) {
  const { clientes, barberos } = useData();
  const top = clientes.slice().sort((a, z) => z.visitas - a.visitas).slice(0, 5);
  return (
    <Paper sub="Reporte de clientes" per={per} pages={9} footL="Datos tratados según la política de privacidad (Ley 1581 de 2012)">
      <PKpis list={[['Atendidos', miles(r.clientes)], ['Nuevos', miles(r.nuevos), '#2f5f8a'], ['Recurrentes', miles(r.clientes - r.nuevos)], ['Retorno', '71 %', '#8a6a2e'], ['No asistieron', miles(r.noShows), '#a23e2c']]} />
      <section className="p-sec">
        <h3 className="p-h3">Clientes con más visitas</h3>
        <div className="p-scroll">
          <table className="ptable wide">
            <thead><tr><th>Cliente</th><th>Celular</th><th className="r">Visitas</th><th>Última visita</th><th className="r">Gastado</th><th>Barbero</th></tr></thead>
            <tbody>
              {top.map((c) => {
                const u = addDays(HOY, -c.dias);
                return (
                  <tr key={c.nombre}>
                    <td className="b">{c.nombre}</td><td>{c.cel}</td><td className="r">{c.visitas}</td>
                    <td>{pad(u.getDate())}/{pad(u.getMonth() + 1)}/{u.getFullYear()}</td><td className="r">{cop(c.total)}</td>
                    <td>{barberos.find((b) => b.id === c.barbero)?.corto}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="p-callout">
        <h3 className="p-h3">Para reactivar: 212 clientes sin volver hace más de 60 días</h3>
        <span>El PDF incluye la lista completa con celular y último servicio, lista para una campaña por WhatsApp.</span>
      </section>
    </Paper>
  );
}

/* ---------- Controles de periodo ---------- */
export function PeriodControls({ params, meses, onChange, extra, onPdf }: { params: PeriodoParams; meses: [string, string][]; onChange: (p: Partial<PeriodoParams>) => void; extra?: ReactNode; onPdf: () => void }) {
  return (
    <div className="filters">
      <div className="field">
        <span>Periodo</span>
        <Seg label="Periodo" value={params.modo} onChange={(modo) => onChange({ modo })} options={[['mes', 'Por mes'], ['rango', 'Rango']]} />
      </div>
      {params.modo === 'mes' ? (
        <label className="field">Mes<Select options={meses} value={params.mes} onChange={(e) => onChange({ mes: e.target.value })} /></label>
      ) : (
        <>
          <label className="field">Desde<input className="input" type="date" value={params.desde} max={iso(HOY)} onChange={(e) => onChange({ desde: e.target.value })} /></label>
          <label className="field">Hasta<input className="input" type="date" value={params.hasta} max={iso(HOY)} onChange={(e) => onChange({ hasta: e.target.value })} /></label>
        </>
      )}
      {extra}
      <div className="push">
        <button type="button" className="btn btn-gold btn-caps" onClick={onPdf}><Icon name="download" size={18} />Descargar PDF</button>
      </div>
    </div>
  );
}
