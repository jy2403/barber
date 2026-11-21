'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NAV_PUB } from '@/lib/constants';
import { useScrolled } from '@/hooks/useScrolled';
import { Icon } from '../ui/Icon';
import { Brand } from './Brand';
import { ScrollLink } from './ScrollLink';

/** Encabezado del sitio público. `simple` muestra solo la marca y "volver" */
export function SiteHeader({ simple = false }: { simple?: boolean }) {
  const scrolled = useScrolled(12, !simple);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.modal')) setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (simple) {
    return (
      <header className="site-header is-solid" id="site-header">
        <div className="container bar">
          <Brand />
          <Link className="back-link" href="/">
            <Icon name="back" size={16} />
            <span className="d-only">Volver al inicio</span>
            <span className="m-only">Inicio</span>
          </Link>
        </div>
      </header>
    );
  }

  const close = () => setOpen(false);
  return (
    <header className={'site-header' + (scrolled ? ' is-solid' : '') + (open ? ' menu-open' : '')} id="site-header">
      <div className="container bar">
        <Brand />
        <nav className="site-nav" aria-label="Principal">
          {NAV_PUB.map(([id, txt]) => <ScrollLink key={id} to={id}>{txt}</ScrollLink>)}
        </nav>
        <div className="header-actions">
          <Link className="link-staff" href="/acceso"><Icon name="user" size={16} />Acceso equipo</Link>
          <Link className="btn btn-gold btn-caps hdr-cta" href="/agendar">
            <span className="long">Agendar cita</span>
            <span className="short">Agendar</span>
          </Link>
          <button type="button" className="btn btn-icon btn-quiet menu-btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Cerrar menú' : 'Abrir menú'}>
            <Icon name={open ? 'x' : 'menu'} size={20} />
          </button>
        </div>
      </div>
      <div className="mobile-menu" id="mobile-menu">
        <div className="container">
          <nav aria-label="Menú móvil">
            {NAV_PUB.map(([id, txt]) => (
              <ScrollLink key={id} to={id} className="mm-link" onNavigate={close}>{txt}<Icon name="right" size={18} /></ScrollLink>
            ))}
            <div className="mm-actions">
              <Link className="btn btn-gold btn-lg btn-caps" href="/agendar">Agendar mi cita</Link>
              <Link className="btn btn-quiet" href="/acceso"><Icon name="user" size={16} />Acceso equipo</Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
