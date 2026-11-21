'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { useData } from '@/context/DataContext';
import { isMobile, useUI } from '@/context/UIContext';
import { useBodyClass } from '@/hooks/useBodyClass';
import { EMBLEMA } from '@/lib/assets';
import { AHORA_DEMO, hora } from '@/lib/format';
import { YO } from '@/lib/constants';
import { Avatar, AvatarIni } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { SkipLink } from './SiteFooter';

type Rol = 'admin' | 'barbero';
type NavLink = [id: string, label: string, icon: string, href: string, count?: string];

interface Props {
  rol: Rol;
  active: string;
  children: ReactNode;
  /** Botones extra de la barra superior (móvil) */
  tb?: ReactNode;
  /** Subpágina: muestra "volver" y una barra de guardado en lugar de la navegación inferior */
  sub?: boolean;
  back?: string;
  tbTitle?: string;
  savebar?: ReactNode;
}

/** Estructura de los paneles internos: menú lateral, barra superior y navegación inferior */
export function PanelShell({ rol, active, children, tb, sub, back, tbTitle, savebar }: Props) {
  const { agendaHoy } = useData();
  const { openDrawer, closeDrawer, drawerOpen, closeSheet } = useUI();
  const sideClose = useRef<HTMLButtonElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  useBodyClass(sub ? 'has-bar' : 'has-bottomnav');

  useEffect(() => {
    if (drawerOpen) setTimeout(() => sideClose.current?.focus({ preventScroll: true }), 50);
  }, [drawerOpen]);
  // Al salir del panel, cierra el menú y la hoja de detalle
  useEffect(() => () => { closeDrawer(); closeSheet(); }, [closeDrawer, closeSheet]);

  const cerrar = () => {
    closeDrawer();
    if (isMobile()) menuBtn.current?.focus({ preventScroll: true });
  };

  const activasHoy = agendaHoy.filter((c) => c.est !== 'cancelada').length;
  const home = rol === 'admin' ? '/admin' : '/barbero/citas';
  const groups: [string, NavLink[]][] =
    rol === 'admin'
      ? [
          ['Operación', [['dashboard', 'Dashboard', 'dash', '/admin'], ['agenda', 'Agenda de citas', 'cal', '/admin/agenda', String(activasHoy)]]],
          ['Equipo y clientes', [['barberos', 'Barberos', 'team', '/admin/barberos'], ['servicios', 'Servicios', 'scissors', '/admin/servicios'], ['clientes', 'Clientes', 'clients', '/admin/clientes']]],
          ['Caja', [['ventas', 'Ventas', 'receipt', '/admin/ventas'], ['reportes', 'Reportes', 'report', '/admin/reportes']]],
          ['Sistema', [['configuracion', 'Configuración', 'sliders', '/admin/configuracion']]],
        ]
      : [['Mi trabajo', [['perfil', 'Mi perfil', 'user', '/barbero/perfil'], ['citas', 'Mis citas', 'cal', '/barbero/citas', agendaHoy.filter((c) => c.b === YO).length + ' hoy'], ['ventas', 'Mis ventas', 'receipt', '/barbero/ventas'], ['reportes', 'Mi reporte', 'report', '/barbero/reportes']]]];
  const bottom: NavLink[] =
    rol === 'admin'
      ? [['dashboard', 'Inicio', 'dash', '/admin'], ['agenda', 'Agenda', 'cal', '/admin/agenda'], ['ventas', 'Ventas', 'receipt', '/admin/ventas'], ['clientes', 'Clientes', 'clients', '/admin/clientes'], ['mas', 'Más', 'menu', '']]
      : [['citas', 'Citas', 'cal', '/barbero/citas'], ['ventas', 'Ventas', 'receipt', '/barbero/ventas'], ['reportes', 'Reporte', 'report', '/barbero/reportes'], ['perfil', 'Perfil', 'user', '/barbero/perfil']];

  const proxima = rol === 'barbero'
    ? agendaHoy.filter((c) => c.b === YO && (c.est === 'confirmada' || c.est === 'pendiente') && c.ini >= AHORA_DEMO).sort((a, z) => a.ini - z.ini)[0]
    : undefined;

  return (
    <>
      <SkipLink />
      <div className={'panel' + (sub ? ' is-sub' : '')}>
        <aside className="sidebar" id="sidebar" aria-label={rol === 'admin' ? 'Menú del administrador' : 'Menú del barbero'}>
          <div className="side-brand">
            <Link href={home} onClick={closeDrawer}>
              <img src={EMBLEMA} alt="" width={44} height={44} />
              <span className="brand-text">
                <span className="brand-name">AURUM</span>
                <span className="brand-sub">{rol === 'admin' ? 'Administración' : 'Panel de barbero'}</span>
              </span>
            </Link>
            <button ref={sideClose} type="button" className="btn btn-icon side-close" onClick={cerrar} aria-label="Cerrar menú">
              <Icon name="x" size={20} />
            </button>
          </div>
          {rol === 'barbero' && (
            <div className="side-card">
              <Avatar id={YO} className="av-md" />
              <span className="side-card-text"><b>Santiago Ríos</b><span style={{ color: 'var(--ok)' }}>● Activo</span></span>
            </div>
          )}
          <nav className="side-nav" aria-label="Secciones">
            {groups.map(([g, links]) => (
              <div className="side-group" key={g}>
                <span className="side-label">{g}</span>
                {links.map(([id, label, icon, href, count]) => (
                  <Link key={id} className="side-link" href={href} aria-current={id === active ? 'page' : undefined} onClick={closeDrawer}>
                    <Icon name={icon} size={19} />
                    <span>{label}</span>
                    {count && <span className="side-count">{count}</span>}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="side-foot">
            {rol === 'barbero' ? (
              <>
                {proxima && (
                  <div className="side-next">
                    <span className="label-caps" style={{ color: 'var(--gold)' }}>Próxima cita</span>
                    <b>{hora(proxima.ini)}</b>
                    <span>{proxima.cliente} · {proxima.largo}</span>
                  </div>
                )}
                <div className="side-links">
                  <Link href="/"><Icon name="globe" size={18} />Ver la página pública</Link>
                  <Link href="/acceso"><Icon name="logout" size={18} />Cerrar sesión</Link>
                </div>
              </>
            ) : (
              <>
                <div className="side-links"><Link href="/"><Icon name="globe" size={18} />Ver la página pública</Link></div>
                <div className="side-card">
                  <AvatarIni name="Laura Martínez" className="av-md" />
                  <span className="side-card-text"><b>Laura Martínez</b><span>Administradora</span></span>
                  <Link className="btn btn-icon btn-quiet" href="/acceso" aria-label="Cerrar sesión"><Icon name="logout" size={18} /></Link>
                </div>
              </>
            )}
          </div>
        </aside>
        <div className="scrim" onClick={cerrar} />
        <div className="panel-col">
          <header className="topbar">
            {back ? (
              <>
                <Link className="btn btn-icon tb-btn" href={back} aria-label="Volver"><Icon name="back" size={20} /></Link>
                <span className="tb-title">{tbTitle}</span>
              </>
            ) : (
              <>
                <button ref={menuBtn} type="button" className="btn btn-icon tb-btn" onClick={openDrawer} aria-label="Abrir menú" aria-controls="sidebar"><Icon name="menu" size={22} /></button>
                <Link className="tb-brand" href={home}><img src={EMBLEMA} alt="" /><span>AURUM</span></Link>
              </>
            )}
            <span className="tb-space" />
            {tb}
          </header>
          <main className="main" id="main" tabIndex={-1}>{children}</main>
        </div>
        {sub ? (
          savebar && <div className="savebar">{savebar}</div>
        ) : (
          <nav className="bottomnav" aria-label="Accesos rápidos">
            {bottom.map(([id, label, icon, href]) => {
              const cur = id === active || (rol === 'admin' && id === 'mas' && ['barberos', 'servicios', 'reportes', 'configuracion'].includes(active));
              return id === 'mas' ? (
                <button key={id} type="button" className="bn-link" onClick={openDrawer} aria-current={cur ? 'page' : undefined}><Icon name={icon} size={22} /><span>{label}</span></button>
              ) : (
                <Link key={id} className="bn-link" href={href} aria-current={cur ? 'page' : undefined}><Icon name={icon} size={22} /><span>{label}</span></Link>
              );
            })}
          </nav>
        )}
        <div className="sheet-scrim" onClick={closeSheet} />
      </div>
    </>
  );
}
