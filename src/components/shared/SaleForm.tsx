'use client';

import { DESCUENTOS, METODOS, SEG, metodoTxt } from '@/lib/constants';
import { HOY, cap, cop, fLarga, hora, plural, ticketTxt } from '@/lib/format';
import { scrollBehavior } from '@/context/UIContext';
import { useBarberos } from '@/hooks/useBarberos';
import { useClientes } from '@/hooks/useClientes';
import { useServicios } from '@/hooks/useServicios';
import type { SaleFormApi } from '@/hooks/useSaleForm';
import { Avatar, AvatarIni } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Select, Seg } from '../ui/Form';

/** Formulario "Registrar venta" */
export function SaleForm({ vf }: { vf: SaleFormApi }) {
  const { s, rol, calc } = vf;
  const { activos, porId } = useBarberos();
  const { sugerir } = useClientes();
  const { porId: svPorId } = useServicios();
  const quien = rol === 'admin' ? 'Laura Martínez (admin)' : 'Santiago Ríos';
  const sugeridos = sugerir(s.q);

  const guardar = async () => {
    const ok = await vf.guardar();
    if (!ok && !s.items.length) document.getElementById('vf-lines')?.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
  };

  const mini =
    plural(s.items.length, 'servicio', 'servicios') + ' ' + cop(calc.sub) +
    (calc.desc ? ' · desc. ' + (calc.dtxt ? calc.dtxt.replace('−', '') + ' ' : '') + '−' + cop(calc.desc) : ' · sin descuento') +
    ' · propina ' + (s.propina ? '+' + cop(s.propina) : '$0');

  return (
    <form className="card vf" aria-label="Registrar venta" noValidate onSubmit={(e) => e.preventDefault()}>
      <div className="vf-head">
        <div>
          <h2>Registrar venta</h2>
          <small>Ticket #{ticketTxt(vf.ticket)} · {cap(fLarga(HOY))}, {hora(vf.horaTicket)}</small>
        </div>
        <span className="badge b-line"><Icon name="user" size={14} />Registra: {quien}</span>
      </div>

      <div className="vf-sec tint">
        <span className="label-caps">Cargar desde una cita de hoy · opcional</span>
        {s.citas.length ? (
          <div className="chips">
            {s.citas.map((c, i) => (
              <button key={c.id} type="button" className="vf-cita" aria-pressed={s.cita === i} onClick={() => vf.cargarCita(i)}>
                <b>{hora(c.ini)} · {c.cliente}{c.est === 'encurso' ? ' · en curso' : ''}</b>
                <small>{c.largo}{rol === 'admin' ? ' · ' + (porId(c.b)?.corto || '') : ''}</small>
              </button>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 13 }}>No hay citas en curso ni próximas para cobrar.</p>
        )}
      </div>

      <div className="vf-sec">
        <div className="vf-sec-head">
          <span className="label-caps">Cliente · opcional</span>
          <Seg label="Tipo de cliente" value={s.modo} onChange={vf.setModo} options={[['registrado', 'Registrado'], ['nuevo', 'Nuevo'], ['ocasional', 'Ocasional']]} />
        </div>
        {s.modo === 'registrado' ? (
          s.cliente ? (
            <div className="vf-client">
              <AvatarIni name={s.cliente.nombre} className="av-md" />
              <span className="vf-client-text"><b>{s.cliente.nombre}</b><small>{s.cliente.detalle}</small></span>
              <Badge cls={SEG[s.cliente.seg].cls} dot={false}>{SEG[s.cliente.seg].txt}</Badge>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => { vf.limpiarCliente(); setTimeout(() => document.getElementById('vf-q')?.focus(), 0); }}>Cambiar</button>
            </div>
          ) : (
            <>
              <label className="search">
                <Icon name="search" size={18} />
                <span className="sr-only">Buscar cliente</span>
                <input id="vf-q" type="search" value={s.q} placeholder="Buscar por celular o nombre" autoComplete="off" onChange={(e) => vf.setQ(e.target.value)} />
              </label>
              {s.q.trim() && (sugeridos.length ? (
                <div className="sugg" style={{ marginTop: 8 }}>
                  {sugeridos.map((c) => (
                    <button key={c.nombre} type="button" onClick={() => vf.elegirCliente(c.nombre)}>
                      <AvatarIni name={c.nombre} className="av-sm" />
                      <span>{c.nombre} <small>· {c.cel}</small></span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 13, paddingTop: 8 }}>Sin coincidencias. Puedes registrarlo como cliente nuevo.</p>
              ))}
            </>
          )
        ) : s.modo === 'nuevo' ? (
          <div className="fgrid">
            <label className="field">Nombre completo *<input className="input" value={s.nuevo.nombre} placeholder="Ej. Juan Pablo Pérez" autoComplete="off" onChange={(e) => vf.setNuevo('nombre', e.target.value)} /></label>
            <label className="field">Celular *<input className="input" type="tel" inputMode="numeric" value={s.nuevo.cel} placeholder="300 000 0000" onChange={(e) => vf.setNuevo('cel', e.target.value)} /></label>
            <label className="field">Correo (opcional)<input className="input" type="email" value={s.nuevo.correo} placeholder="nombre@correo.com" onChange={(e) => vf.setNuevo('correo', e.target.value)} /></label>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 13 }}>La venta se registra como cliente ocasional y no suma al historial de ningún cliente.</p>
        )}
      </div>

      <div className="vf-sec">
        {rol === 'barbero' ? (
          <>
            <span className="label-caps">Barbero que realizó el servicio</span>
            <div className="vf-locked">
              <Avatar id="santiago" className="av-sm" />
              <span>Santiago Ríos <span className="muted">(tú)</span></span>
              <span style={{ marginLeft: 'auto', color: 'var(--ink-4)' }}><Icon name="lock" size={16} /></span>
            </div>
            <span className="muted" style={{ fontSize: 12 }}>Solo puedes registrar ventas de servicios que tú realizaste.</span>
          </>
        ) : (
          <label className="field">
            <span className="label-caps">Barbero que realizó el servicio</span>
            <Select options={activos.map((b) => [b.id, b.nombre + ' · ' + b.espC])} value={s.b} onChange={(e) => vf.setBarbero(e.target.value)} />
          </label>
        )}
      </div>

      <div className="vf-sec" id="vf-lines">
        <span className="label-caps">Servicios realizados</span>
        <div className="vf-lines">
          {s.items.length ? (
            s.items.map((id, i) => {
              const v = svPorId(id);
              const nombre = v?.nombre || id;
              return (
                <div className="vf-line" key={i}>
                  <span><b>{nombre}</b><small>{v?.dur} min</small></span>
                  <strong>{cop(v?.precio || 0)}</strong>
                  <button type="button" className="btn btn-icon btn-quiet" aria-label={'Quitar ' + nombre} onClick={() => vf.delItem(i)}><Icon name="x" size={16} /></button>
                </div>
              );
            })
          ) : (
            <p className="vf-empty">Agrega al menos un servicio.</p>
          )}
        </div>
        <div className="chips">
          {vf.ofrecidos.map((v) => (
            <button key={v.id} type="button" className="chip chip-dashed" onClick={() => vf.addItem(v.id)}><Icon name="plus" size={15} />{v.nombre} · {cop(v.precio)}</button>
          ))}
        </div>
        {s.err && <p className="field"><span className="err">{s.err}</span></p>}
      </div>

      <div className="vf-split">
        <div className="vf-sec">
          <span className="label-caps">Descuento</span>
          <div className="chips">
            {DESCUENTOS.map((d) => <button key={d.id} type="button" className="chip" aria-pressed={s.desc === d.id} onClick={() => vf.setDesc(d.id)}>{d.label}</button>)}
          </div>
          {s.desc !== 'no' && (
            <label className="field">Motivo del descuento
              <Select options={['Cliente frecuente', 'Promoción vigente', 'Cortesía de la casa', 'Otro motivo']} value={s.motivo} onChange={(e) => vf.setMotivo(e.target.value)} />
            </label>
          )}
          {rol === 'barbero' && <span className="muted" style={{ fontSize: 12 }}>Descuentos mayores al 15 % requieren aprobación del administrador.</span>}
        </div>
        <div className="vf-sec">
          <span className="label-caps">Propina</span>
          <div className="chips">
            {[0, 2000, 5000, 10000].map((v) => <button key={v} type="button" className="chip" aria-pressed={s.propina === v} onClick={() => vf.setPropina(v)}>{v ? cop(v) : 'Sin propina'}</button>)}
          </div>
          <span className="muted" style={{ fontSize: 12 }}>La propina es 100 % del barbero y no cuenta como venta de la barbería.</span>
        </div>
      </div>

      <div className="vf-sec">
        <span className="label-caps">Método de pago</span>
        <div className="vf-methods">
          {METODOS.map(([id, txt]) => <button key={id} type="button" className="chip" aria-pressed={s.metodo === id} onClick={() => vf.setMetodo(id)}>{txt}</button>)}
        </div>
      </div>

      <div className="vf-total">
        <div className="vf-tot-l">
          <div className="vf-sum"><span>Total · {metodoTxt(s.metodo)}</span><b>{cop(calc.total)}</b></div>
          <span className="vf-mini">{mini}</span>
        </div>
        <div className="vf-btns">
          <button type="button" className="btn btn-gold btn-caps" onClick={guardar}><Icon name="check" size={18} />Registrar venta</button>
          <button type="button" className="btn btn-quiet" onClick={vf.limpiar}>Limpiar</button>
        </div>
      </div>
    </form>
  );
}
