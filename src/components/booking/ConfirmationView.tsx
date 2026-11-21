'use client';

import Link from 'next/link';
import type { Confirmacion } from '@/types';
import { NEGOCIO, VENTANA } from '@/lib/constants';
import { HOY, addDays, cap, cop, fLarga, hora, pad } from '@/lib/format';
import { slotsDe } from '@/lib/domain/availability';
import { useData } from '@/context/DataContext';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { SiteHeader } from '../layout/SiteHeader';

function gcalLink(c: Confirmacion) {
  const d = c.dia;
  const f = (min: number) => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(Math.floor(min / 60)) + pad(min % 60) + '00';
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Cita en AURUM Barber Club · ' + c.sv.nombre) +
    '&dates=' + f(c.hora) + '/' + f(c.hora + c.sv.dur) + '&ctz=America/Bogota&details=' +
    encodeURIComponent('Barbero: ' + c.b.nombre + '. Total a pagar en el local: ' + cop(c.sv.precio) + '.') + '&location=' + encodeURIComponent(NEGOCIO.dirCorta);
}

export function ConfirmationView() {
  const { confirmada, barberos, servicios } = useData();
  let c = confirmada;
  if (!c) {
    // Vista de ejemplo cuando se entra directo a la URL
    const b = barberos.find((x) => x.id === 'santiago')!;
    const sv = servicios.find((x) => x.id === 'combo')!;
    let dia: Date | null = null;
    let h: number | null = null;
    for (let k = 1; k <= VENTANA && !dia; k++) {
      const d = addDays(HOY, k);
      const ls = slotsDe(b, sv, d);
      if (ls.length) { dia = d; h = ls[Math.min(2, ls.length - 1)]; }
    }
    c = { nombre: 'Andrés Felipe Mora', cel: '3105559917', sv, b, dia: dia || addDays(HOY, 1), hora: h || 630 };
  }

  return (
    <div className="confirm">
      <SiteHeader simple />
      <main id="main" tabIndex={-1}>
        <span className="confirm-icon"><Icon name="check" size={40} /></span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <span className="eyebrow center">Cita confirmada</span>
          <h1>Te esperamos, <em>{c.nombre.split(' ')[0]}.</em></h1>
          <p className="muted" style={{ maxWidth: 520 }}>Enviamos la confirmación por WhatsApp al +57 {c.cel.slice(0, 3)} *** {c.cel.slice(6)}. Un día antes te recordamos tu cita.</p>
        </div>
        <div className="ticket">
          <div className="ticket-head">
            <Avatar id={c.b.id} className="av-lg av-gold" />
            <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <b className="bname" style={{ fontSize: 25 }}>{c.b.nombre}</b>
              <span className="muted" style={{ fontSize: 13 }}>Tu barbero · {c.b.esp}</span>
            </span>
          </div>
          <div className="ticket-grid">
            <div><span>Servicio</span><span>{c.sv.nombre} · {c.sv.dur} min</span></div>
            <div><span>Fecha y hora</span><span>{cap(fLarga(c.dia))} · {hora(c.hora)}</span></div>
            <div><span>Dónde</span><span>{NEGOCIO.dirCorta}</span></div>
            <div><span>Total a pagar en el local</span><span className="ticket-price">{cop(c.sv.precio)}</span></div>
          </div>
        </div>
        <div className="confirm-ctas">
          <a className="btn btn-gold btn-caps" href={gcalLink(c)} target="_blank" rel="noopener"><Icon name="cal" size={18} />Agregar a mi calendario</a>
          <a className="btn btn-ghost" href="https://maps.google.com/" target="_blank" rel="noopener"><Icon name="pin" size={18} />Cómo llegar</a>
        </div>
        <Link className="link" href="/agendar">Reprogramar o cancelar la cita</Link>
      </main>
    </div>
  );
}
