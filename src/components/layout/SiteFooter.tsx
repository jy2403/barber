'use client';

import Link from 'next/link';
import { NEGOCIO } from '@/lib/constants';
import { HOY } from '@/lib/format';
import { useUI } from '@/context/UIContext';
import { Icon } from '../ui/Icon';
import { Brand } from './Brand';
import { ScrollLink } from './ScrollLink';

export function SiteFooter() {
  const { toast } = useUI();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="foot-grid">
          <div className="foot-col foot-brand">
            <Brand />
            <p style={{ marginTop: 16, maxWidth: 320 }}>Barbería de autor. Corte, barba y afeitado clásico con cita previa.</p>
          </div>
          <nav className="foot-col" aria-label="Pie de página">
            <h3>Navegación</h3>
            <ScrollLink to="servicios">Servicios</ScrollLink>
            <ScrollLink to="barberos">Barberos</ScrollLink>
            <Link href="/agendar">Agendar cita</Link>
            <Link href="/acceso">Acceso equipo</Link>
          </nav>
          <div className="foot-col">
            <h3>Contacto</h3>
            <span>{NEGOCIO.dirCorta}</span>
            <span>WhatsApp {NEGOCIO.wa}</span>
            <span>Instagram {NEGOCIO.ig}</span>
          </div>
          <div className="foot-col">
            <h3>Legal</h3>
            {['Política de tratamiento de datos', 'Políticas de cancelación', 'Términos del servicio'].map((t) => (
              <a key={t} href="#" onClick={(e) => { e.preventDefault(); toast('Enlaza aquí: ' + t, 'info'); }}>{t}</a>
            ))}
          </div>
        </div>
        <div className="foot-legal">
          <span>© {HOY.getFullYear()} AURUM Barber Club · NIT {NEGOCIO.nit}</span>
          <span>Hecho para lucir impecable.</span>
        </div>
      </div>
    </footer>
  );
}

export function WaFloat() {
  return (
    <a className="wa-float" href={NEGOCIO.waLink} target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">
      <Icon name="wa" size={26} />
    </a>
  );
}

/** Botón "Saltar al contenido" */
export function SkipLink() {
  return (
    <button type="button" className="skip" onClick={() => { const m = document.getElementById('main'); if (m) { m.setAttribute('tabindex', '-1'); m.focus(); } }}>
      Saltar al contenido
    </button>
  );
}
