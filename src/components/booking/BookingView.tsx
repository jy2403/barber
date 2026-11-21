'use client';
/* eslint-disable @next/next/no-img-element */

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { EMBLEMA } from '@/lib/assets';
import { NEGOCIO, VENTANA } from '@/lib/constants';
import { HOY, MESES, cap, cop, diffDays, digits, fLarga, fMedia, hora, iso, sameDay } from '@/lib/format';
import { scrollBehavior, useUI } from '@/context/UIContext';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useBooking } from '@/hooks/useBooking';
import { Avatar, AvatarEmblem } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { SiteHeader } from '../layout/SiteHeader';
import { SkipLink } from '../layout/SiteFooter';

const DOW = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];
const GRUPOS: [string, number, number][] = [['Mañana', 0, 720], ['Tarde', 720, 1080], ['Noche', 1080, 1440]];

export function BookingView() {
  const q = useSearchParams();
  const router = useRouter();
  const { toast } = useUI();
  const bk = useBooking({ s: q.get('s'), b: q.get('b') });
  const [otp, setOtp] = useState<string | null>(null);
  useBodyClass('has-bar');

  const { sv, mes, dia, libres, barbero, asignado, form, errors } = bk;
  const okHora = bk.hora !== null;
  const mi = bk.meses.findIndex((x) => sameDay(x, mes));

  const onConfirm = () => {
    if (bk.hora === null) {
      toast('Elige un día y una hora disponibles.', 'alert');
      document.getElementById('paso2')?.scrollIntoView({ behavior: scrollBehavior() });
      return;
    }
    const first = bk.validar();
    if (first) {
      const f = document.getElementById('bk-' + first);
      f?.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
      setTimeout(() => f?.focus({ preventScroll: true }), scrollBehavior() === 'auto' ? 0 : 350);
      return;
    }
    setOtp('');
  };

  const onDone = async () => {
    await bk.confirmar();
    setOtp(null);
    router.push('/agendar/confirmada');
  };

  const elegirDia = (d: Date) => {
    bk.elegirDia(d);
    const s = document.getElementById('slots');
    if (s && window.innerWidth < 980) setTimeout(() => s.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() }), 0);
  };

  /* ---------- Calendario ---------- */
  const lead = (new Date(mes.getFullYear(), mes.getMonth(), 1).getDay() + 6) % 7;
  const totalDias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas = [];
  for (let i = 0; i < lead; i++) celdas.push(<span key={'l' + i} aria-hidden="true" />);
  for (let k = 1; k <= totalDias; k++) {
    const d = new Date(mes.getFullYear(), mes.getMonth(), k);
    const off = diffDays(d, HOY);
    const enVent = off >= 0 && off <= VENTANA;
    const c = enVent ? bk.cuposDe(d) : 0;
    let cls = 'cal-day';
    let aria = fLarga(d);
    if (enVent && c === 0) { cls += ' is-full'; aria += ', sin cupos'; }
    if (c > 0) { cls += ' is-free ' + (c <= 3 ? 'dot-few' : 'dot-full'); aria += c <= 3 ? ', últimos cupos' : ', disponible'; }
    if (off === 0) { cls += ' is-today'; aria += ', hoy'; }
    celdas.push(
      <button key={iso(d)} type="button" className={cls} aria-label={aria} aria-pressed={sameDay(d, dia)} disabled={!c} onClick={() => elegirDia(d)}>
        {k}<i />
      </button>,
    );
  }
  const grupos = GRUPOS.map(([g, a, z]) => {
    const hs = libres.filter((t) => t >= a && t < z);
    return hs.length ? (
      <div className="slot-group" key={g}>
        <span className="label-caps">{g}</span>
        <div className="slots">
          {hs.map((t) => <button key={t} type="button" className="slot" aria-pressed={t === bk.hora} onClick={() => bk.elegirHora(t)}>{hora(t)}</button>)}
        </div>
      </div>
    ) : null;
  }).filter(Boolean);

  const quien = barbero ? barbero.corto : asignado ? asignado.corto : 'Cualquier barbero';
  const d = digits(form.cel);

  return (
    <>
      <SkipLink />
      <SiteHeader simple />
      <section className="page-top">
        <div className="container">
          <span className="eyebrow">Reserva en línea</span>
          <h1 className="page-title">Agenda tu cita</h1>
          <p className="page-lead">Tres pasos y listo. Te confirmamos por WhatsApp y te recordamos el día anterior.</p>
          <ol className="progress" aria-label="Pasos de la reserva">
            <li className="done"><b>1</b><span>Servicio</span></li>
            <li className={okHora ? 'done' : 'now'}><b>{okHora ? '✓' : '2'}</b><span>Barbero y horario</span></li>
            <li className={okHora ? 'now' : ''}><b>3</b><span>Tus datos</span></li>
          </ol>
        </div>
      </section>

      <main id="main" tabIndex={-1} className="container book">
        <section className="book-step" id="paso1" aria-labelledby="t-paso1">
          <h2 className="step-title" id="t-paso1"><small>01</small>Elige el servicio</h2>
          <div className="opt-grid" role="radiogroup" aria-label="Servicio">
            {bk.activos.map((s) => (
              <button key={s.id} type="button" className="opt" role="radio" aria-checked={s.id === sv.id} onClick={() => bk.elegirServicio(s.id)}>
                <span className="radio-dot" />
                <span className="opt-name">{s.nombre}</span>
                <span className="opt-meta"><span>{s.dur} min</span><span>{cop(s.precio)}</span></span>
              </button>
            ))}
          </div>
        </section>

        <section className="book-step" id="paso2" aria-labelledby="t-paso2">
          <h2 className="step-title" id="t-paso2"><small>02</small>Elige barbero, día y hora</h2>
          <div className="pick">
            <div className="barbers" role="radiogroup" aria-label="Barbero">
              {bk.opcionesBarbero.map((o) => (
                <button key={o.id} type="button" className="bopt" role="radio" aria-checked={o.id === bk.bid} disabled={o.disabled} onClick={() => bk.elegirBarbero(o.id)}>
                  {o.b ? <Avatar id={o.b.id} /> : <AvatarEmblem />}
                  <span className="bopt-text">
                    <span className="bopt-name">{o.b ? o.b.nombre : 'Cualquier barbero'}</span>
                    <span className="bopt-sub">{o.b ? o.b.esp : 'Te asignamos el primero disponible'}</span>
                    <span className={'bopt-note ' + o.cls}>{o.nota}</span>
                  </span>
                  <span className="radio-dot" />
                </button>
              ))}
            </div>

            <div className="card cal">
              <div className="cal-nav">
                <button type="button" className="btn btn-icon btn-quiet" aria-label="Mes anterior" disabled={mi <= 0} onClick={() => bk.moverMes(-1)}><Icon name="left" size={18} /></button>
                <span className="cal-month" aria-live="polite">{cap(MESES[mes.getMonth()])} {mes.getFullYear()}</span>
                <button type="button" className="btn btn-icon btn-quiet" aria-label="Mes siguiente" disabled={mi >= bk.meses.length - 1} onClick={() => bk.moverMes(1)}><Icon name="right" size={18} /></button>
              </div>
              <div className="cal-grid">
                {DOW.map((x) => <span key={x} className="cal-dow" aria-hidden="true">{x}</span>)}
                {celdas}
              </div>
              <div className="cal-legend">
                <span><span className="cal-day dot-full" style={{ height: 'auto', display: 'inline-flex' }}><i /></span>Disponible</span>
                <span><span className="cal-day dot-few" style={{ height: 'auto', display: 'inline-flex' }}><i /></span>Últimos cupos</span>
                <span><span style={{ textDecoration: 'line-through', color: '#77736b', fontWeight: 700 }}>12</span>Sin cupos o día libre</span>
              </div>
              <div className="slots-box" id="slots">
                <span className="label-caps" style={{ color: 'var(--ink-2)' }}>Horas disponibles · {dia ? fLarga(dia) : 'sin día seleccionado'}</span>
                {grupos.length ? grupos : <p className="muted" style={{ fontSize: 14 }}>No hay horas libres este mes con esta combinación. Prueba otro barbero o el mes siguiente.</p>}
              </div>
            </div>
          </div>
        </section>

        <section className="book-step" id="paso3" aria-labelledby="t-paso3">
          <h2 className="step-title" id="t-paso3"><small>03</small>Tus datos</h2>
          <div className="datos">
            <form className="card datos-form" aria-label="Datos del cliente" noValidate onSubmit={(e) => e.preventDefault()}>
              <p className="note"><Icon name="info" size={18} /><span>Escribe primero tu celular: si ya nos visitaste, completamos el resto por ti.</span></p>
              <div aria-live="polite">
                {bk.conocido && (
                  <p className="note note-ok"><Icon name="check" size={18} /><span>¡Hola de nuevo, {bk.conocido.split(' ')[0]}! Completamos tus datos. Revisa que estén bien.</span></p>
                )}
              </div>
              <div className="fgrid">
                <label className="field" htmlFor="bk-cel">Celular (WhatsApp) *
                  <span className="igroup" aria-invalid={errors.cel ? true : undefined}>
                    <span>+57</span>
                    <input id="bk-cel" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="300 123 4567" maxLength={14} value={form.cel} onChange={(e) => bk.setCampo('cel', e.target.value)} />
                  </span>
                  <span className="hint">Prueba con 310 555 9917 (cliente registrado).</span>
                  <span className="err" aria-live="polite">{errors.cel}</span>
                </label>
                <label className="field" htmlFor="bk-nombre">Nombre completo *
                  <input className="input" id="bk-nombre" autoComplete="name" placeholder="Nombres y apellidos" value={form.nombre} aria-invalid={errors.nombre ? true : undefined} onChange={(e) => bk.setCampo('nombre', e.target.value)} />
                  <span className="err" aria-live="polite">{errors.nombre}</span>
                </label>
                <label className="field" htmlFor="bk-correo">Correo electrónico *
                  <input className="input" id="bk-correo" type="email" autoComplete="email" placeholder="nombre@correo.com" value={form.correo} aria-invalid={errors.correo ? true : undefined} onChange={(e) => bk.setCampo('correo', e.target.value)} />
                  <span className="err" aria-live="polite">{errors.correo}</span>
                </label>
                <label className="field" htmlFor="bk-nac">Fecha de nacimiento (opcional)
                  <input className="input" id="bk-nac" type="date" value={form.nac} max={iso(HOY)} onChange={(e) => bk.setCampo('nac', e.target.value)} />
                  <span className="hint">Para tu detalle de cumpleaños.</span>
                </label>
              </div>
              <label className="field" htmlFor="bk-nota">¿Algo que tu barbero deba saber? (opcional)
                <textarea className="textarea" id="bk-nota" rows={3} placeholder="Ej.: quiero el fade más bajo que la última vez, tengo la piel sensible…" value={form.nota} onChange={(e) => bk.setCampo('nota', e.target.value)} />
              </label>
              <div className="stack-v" style={{ gap: 12 }}>
                <label className="check"><input type="checkbox" checked={form.rec} onChange={(e) => bk.setCampo('rec', e.target.checked)} />Quiero recibir el recordatorio de mi cita por WhatsApp.</label>
                <label className="check">
                  <input type="checkbox" id="bk-acepta" checked={form.acepta} onChange={(e) => bk.setCampo('acepta', e.target.checked)} />
                  <span>Autorizo el tratamiento de mis datos personales según la <a href="#" onClick={(e) => { e.preventDefault(); toast('Enlaza aquí tu política de privacidad', 'info'); }}>política de privacidad</a> (Ley 1581 de 2012). *</span>
                </label>
                <span className="field"><span className="err" aria-live="polite">{errors.acepta}</span></span>
              </div>
            </form>

            <aside className="card card-gold summary" aria-label="Resumen de la cita">
              <div className="summary-head"><h3>Resumen de tu cita</h3><img src={EMBLEMA} alt="" width={36} height={36} /></div>
              <div className="summary-body">
                <div className="kv"><span>Servicio</span><span>{sv.nombre} · {sv.dur} min</span></div>
                <div className="kv"><span>Barbero</span><span>{barbero ? barbero.nombre : 'Cualquier barbero'}{asignado && <small className="muted" style={{ display: 'block', fontWeight: 500, fontSize: 12 }}>Se asignará a {asignado.nombre}</small>}</span></div>
                <div className="kv"><span>Fecha</span><span>{dia ? cap(fLarga(dia)) : 'Elige un día'}</span></div>
                <div className="kv"><span>Hora</span><span>{bk.hora !== null ? hora(bk.hora) + ' – ' + hora(bk.hora + sv.dur) : 'Elige una hora'}</span></div>
                <div className="summary-total"><span className="muted">Total a pagar en el local</span><b>{cop(sv.precio)}</b></div>
              </div>
              <div className="summary-foot">
                <button type="button" className="btn btn-gold btn-lg btn-caps btn-block" onClick={onConfirm}>Confirmar cita<Icon name="arrow" size={18} /></button>
                <p>Pagas en la barbería con efectivo, Nequi, Daviplata o tarjeta. Puedes reprogramar o cancelar sin costo hasta 3 horas antes desde el enlace que te llega por WhatsApp.</p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container" style={{ paddingBlock: '24px 28px' }}>
          <div className="foot-legal" style={{ borderTop: 0, paddingTop: 0 }}>
            <span>© {HOY.getFullYear()} AURUM Barber Club</span>
            <span>¿Dudas? Escríbenos por WhatsApp {NEGOCIO.wa}</span>
          </div>
        </div>
      </footer>

      <div className="book-bar" role="region" aria-label="Resumen rápido">
        <span className="book-bar-text">
          <b>{dia && bk.hora !== null ? cap(fMedia(dia)) + ' · ' + hora(bk.hora) : 'Elige día y hora'}</b>
          <span>{sv.nombre} · {quien}<b className="bb-price"> · {cop(sv.precio)}</b></span>
        </span>
        <span className="book-bar-price">{cop(sv.precio)}</span>
        <button type="button" className="btn btn-gold btn-caps" onClick={onConfirm}>Confirmar</button>
      </div>

      {otp !== null && (
        <Modal
          title="Verifica tu celular"
          size="sm"
          focus="#otp"
          onClose={() => setOtp(null)}
          foot={
            <>
              <button type="button" className="btn btn-quiet" onClick={() => toast('Te reenviamos el código por WhatsApp', 'wa')}>Reenviar código</button>
              <button type="button" className="btn btn-gold btn-caps" disabled={otp.length !== 4} onClick={onDone}>Confirmar cita</button>
            </>
          }
        >
          <p className="muted">Enviamos un código de 4 dígitos por WhatsApp al <b className="strong">+57 {d.slice(0, 3)} *** {d.slice(6)}</b>. Así confirmamos que la cita es tuya.</p>
          <label className="field" htmlFor="otp">Código de verificación
            <input className="input otp" id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={4} placeholder="••••" value={otp} onChange={(e) => setOtp(digits(e.target.value).slice(0, 4))} />
            <span className="hint">Demostración: escribe cualquier código de 4 dígitos.</span>
          </label>
        </Modal>
      )}
    </>
  );
}
