'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUI } from '@/context/UIContext';
import { Icon } from '../ui/Icon';
import { Brand } from '../layout/Brand';

export function LoginView() {
  const router = useRouter();
  const { toast } = useUI();
  const [ver, setVer] = useState(false);

  return (
    <div className="login">
      <section className="login-art">
        <Brand />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="eyebrow">Panel del equipo</span>
          <p>Agenda, ventas y reportes del día, en un solo lugar.</p>
        </div>
      </section>
      <main className="login-main" id="main" tabIndex={-1}>
        <form className="login-form" aria-label="Iniciar sesión" noValidate onSubmit={(e) => { e.preventDefault(); router.push('/admin'); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1>Ingresa a tu panel</h1>
            <p className="muted">Un solo acceso para administradores y barberos. Te llevamos a tu panel según tu rol.</p>
          </div>
          <label className="field" htmlFor="lg-mail">Correo electrónico
            <input className="input" id="lg-mail" type="email" autoComplete="username" placeholder="nombre@aurum.co" />
          </label>
          <label className="field" htmlFor="lg-pass">Contraseña
            <span className="igroup">
              <input id="lg-pass" type={ver ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" />
              <button type="button" className="ibtn" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                <Icon name={ver ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px 16px' }}>
            <label className="check"><input type="checkbox" />Recordarme</label>
            <a className="link" href="#" onClick={(e) => { e.preventDefault(); toast('Te enviamos un enlace para crear una contraseña nueva', 'mail'); }}>¿Olvidaste tu contraseña?</a>
          </div>
          <button type="submit" className="btn btn-gold btn-lg btn-caps btn-block">Ingresar<Icon name="arrow" size={18} /></button>
          <div className="login-alt">
            <span>¿Eres barbero? Usa el mismo acceso: <Link href="/barbero/citas">ver panel de barbero</Link></span>
            <span>¿Primera vez? Abre la invitación que te llegó al correo para crear tu contraseña.</span>
            <span><Link href="/"><Icon name="back" size={14} /> Volver a la página pública</Link></span>
          </div>
        </form>
      </main>
    </div>
  );
}
