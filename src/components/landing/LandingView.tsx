'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';
import { HERO, fotoUrl } from '@/lib/assets';
import { NEGOCIO } from '@/lib/constants';
import { addDays, cop, fDM } from '@/lib/format';
import { useBarberos } from '@/hooks/useBarberos';
import { useServicios } from '@/hooks/useServicios';
import { Icon } from '../ui/Icon';
import { SiteHeader } from '../layout/SiteHeader';
import { SiteFooter, SkipLink, WaFloat } from '../layout/SiteFooter';
import { ScrollLink } from '../layout/ScrollLink';

function SecHead({ eyebrow, title, id, aside }: { eyebrow: string; title: ReactNode; id: string; aside?: ReactNode }) {
  return (
    <div className="sec-head">
      <div className="sec-head-text">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="sec-title" id={id}>{title}</h2>
      </div>
      {aside}
    </div>
  );
}

const TRUST: [string, string][] = [['clock', 'Agenda en menos de un minuto'], ['wa', 'Confirmación por WhatsApp'], ['cash', 'Pagas en la barbería']];
const CINTA = ['Corte de precisión', 'Fade', 'Barba a navaja', 'Afeitado clásico', 'Toalla caliente', 'Diseño de cejas'];
const PASOS: [string, string][] = [
  ['Diagnóstico', 'Hablamos de tu tipo de cabello, la forma de tu rostro y tu rutina antes de tocar la tijera.'],
  ['Precisión', 'Tijera y máquina con degradados limpios y líneas definidas que se mantienen semanas.'],
  ['Navaja y toalla caliente', 'Perfilado a navaja, toalla caliente y bálsamo para un acabado suave y sin irritación.'],
  ['Acabado y consejo', 'Styling con producto profesional y una recomendación para mantener el look en casa.'],
];
const TRABAJOS = ['Fade bajo + barba', 'Corte clásico a tijera', 'Barba perfilada', 'Afeitado con toalla caliente', 'Diseño freestyle', 'Interior de la barbería'];

export function LandingView() {
  const { activos } = useServicios();
  const { barberos } = useBarberos();
  const equipo = barberos.filter((b) => b.estado === 'activo').concat(barberos.filter((b) => b.estado === 'vacaciones'));

  // Si llegamos con /#seccion, desplazarse a ella
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
  }, []);

  const cinta = CINTA.map((t) => [<span key={t}>{t}</span>, <i key={t + 'i'} />]);

  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-t">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Barbería de autor</span>
              <h1 className="hero-title" id="hero-t">Entras como siempre.<br /><em>Sales como nunca.</em></h1>
              <p className="hero-lead">Corte de precisión, barba esculpida a navaja y un ritual con toalla caliente pensado al detalle. Cada visita termina igual: mirándote dos veces al espejo.</p>
              <div className="hero-ctas">
                <Link className="btn btn-gold btn-lg btn-caps btn-glow" href="/agendar">Agendar mi cita<Icon name="arrow" size={18} /></Link>
                <ScrollLink to="servicios" className="btn btn-ghost btn-lg">Ver servicios y precios</ScrollLink>
              </div>
              <ul className="hero-trust">{TRUST.map(([i, t]) => <li key={t}><Icon name={i} size={18} />{t}</li>)}</ul>
            </div>
            <div className="arch-wrap">
              <div className="arch-frame"><div className="arch"><img src={HERO} alt="Retrato de un cliente con fade y barba perfilada" /></div></div>
              <span className="hero-chip c1">Fade a medida</span>
              <span className="hero-chip c2">Barba esculpida a navaja</span>
              <span className="hero-chip c3">Ritual de toalla caliente</span>
            </div>
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            <div className="marquee-group">{cinta}</div>
            <div className="marquee-group">{cinta}</div>
          </div>
        </div>

        <section className="section" id="servicios" aria-labelledby="svc-t">
          <div className="container">
            <SecHead eyebrow="La carta de la casa" title={<>Servicios pensados para que <em>se note</em> al salir.</>} id="svc-t"
              aside={<p className="sec-lead">Precio fijo y duración aproximada. Elige el servicio y en el siguiente paso escoges barbero, día y hora.</p>} />
            <div className="svc-grid">
              {activos.map((s) => (
                <article key={s.id} className={'svc-card' + (s.destacado ? ' featured' : '')}>
                  {s.destacado && <span className="svc-tag">{s.nota}</span>}
                  <div className="svc-icon"><Icon name={s.icon} size={22} /></div>
                  <h3 className="svc-name">{s.nombre}</h3>
                  <p className="svc-desc">{s.desc}</p>
                  <div className="svc-foot">
                    <div className="svc-meta"><span className="svc-price">{cop(s.precio)}</span><span className="svc-dur">{s.dur} min</span></div>
                    <Link className="svc-link" href={'/agendar?s=' + s.id} aria-label={'Agendar ' + s.nombre}>Agendar<Icon name="arrow" size={16} /></Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section ritual" id="ritual" aria-labelledby="rit-t">
          <div className="container">
            <div className="ritual-head"><span className="eyebrow center">La experiencia</span><h2 className="sec-title" id="rit-t">Un ritual, <em>no un trámite.</em></h2></div>
            <ol className="steps">
              {PASOS.map(([t, p], i) => <li className="step" key={t}><span className="step-n">0{i + 1}</span><h3>{t}</h3><p>{p}</p></li>)}
            </ol>
          </div>
        </section>

        <section className="section section-alt" id="barberos" aria-labelledby="team-t">
          <div className="container">
            <SecHead eyebrow="El equipo" title={<>Manos que conocen <em>su oficio.</em></>} id="team-t"
              aside={<p className="sec-lead">Agenda con tu barbero de confianza o deja que te asignemos el primero disponible.</p>} />
            <div className="team">
              {equipo.map((b) => {
                const away = b.estado === 'vacaciones' && b.vac;
                return (
                  <article key={b.id} className={'bcard' + (away ? ' is-away' : '')}>
                    <div className="bphoto">
                      <img src={fotoUrl(b.id)} alt={'Foto de ' + b.nombre} loading="lazy" />
                      <span className="btag">{b.espC}</span>
                      {away && <span className="baway">De vacaciones hasta el {fDM(b.vac!.hasta)}.</span>}
                    </div>
                    <div className="bbody">
                      <h3 className="bname">{b.nombre}</h3>
                      <div className="bmeta"><span>{b.exp}</span><span><Icon name="ig" size={14} />{b.ig}</span></div>
                    </div>
                    {away
                      ? <span className="btn btn-quiet bbtn" aria-disabled="true">Vuelve el {fDM(addDays(b.vac!.hasta, 1))}</span>
                      : <Link className="btn btn-ghost bbtn" href={'/agendar?b=' + b.id}>Agendar con {b.corto}</Link>}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section" id="galeria" aria-labelledby="gal-t">
          <div className="container">
            <SecHead eyebrow="Trabajos recientes" title={<>El resultado <em>habla solo.</em></>} id="gal-t"
              aside={<a className="btn btn-ghost" href="https://instagram.com/" target="_blank" rel="noopener"><Icon name="ig" size={18} />Ver más en Instagram</a>} />
            <div className="gallery">
              {TRABAJOS.map((t) => <div className="tile" key={t}><Icon name="camera" size={26} /><span>[Foto real · {t}]</span></div>)}
            </div>
          </div>
        </section>

        <section className="section section-alt" aria-labelledby="rev-t">
          <div className="container">
            <SecHead eyebrow="Reseñas" title={<>Lo que dicen <em>al salir.</em></>} id="rev-t"
              aside={<div className="rating"><b>[4,9]</b><span><span className="stars" aria-label="Calificación de 5 estrellas">★★★★★</span>[000] reseñas en Google</span></div>} />
            <div className="reviews">
              {[0, 1, 2].map((i) => (
                <figure className="review" key={i}>
                  <span className="q" aria-hidden="true">“</span>
                  <blockquote>[Reseña real de un cliente, tomada de Google Maps o Instagram]</blockquote>
                  <figcaption>[Nombre del cliente]<span>[Servicio] · [Barbero]</span></figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="ubicacion" aria-labelledby="loc-t">
          <div className="container loc">
            <div className="map" role="img" aria-label="Espacio para el mapa de Google Maps">
              <div className="map-pin"><span><Icon name="pin" size={28} /></span><span>[Mapa de Google Maps embebido]</span></div>
            </div>
            <div className="loc-info">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <span className="eyebrow">Visítanos</span>
                <h2 className="loc-title" id="loc-t">{NEGOCIO.dir}</h2>
                <p className="muted">{NEGOCIO.zona}</p>
              </div>
              <div className="hours">{NEGOCIO.horario.map(([d, h]) => <div key={d}><span>{d}</span><span>{h}</span></div>)}</div>
              <div className="loc-ctas">
                <a className="btn btn-gold" href={NEGOCIO.waLink} target="_blank" rel="noopener"><Icon name="wa" size={18} />WhatsApp {NEGOCIO.wa}</a>
                <a className="btn btn-ghost" href="https://maps.google.com/" target="_blank" rel="noopener"><Icon name="pin" size={18} />Cómo llegar</a>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-band" aria-labelledby="cta-t">
          <div className="container">
            <div>
              <h2 id="cta-t">Tu mejor versión está <em>a una cita.</em></h2>
              <p>Elige servicio, barbero, día y hora. Te confirmamos por WhatsApp.</p>
            </div>
            <Link className="btn btn-gold btn-lg btn-caps btn-glow" href="/agendar">Agendar mi cita<Icon name="arrow" size={18} /></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
      <WaFloat />
    </>
  );
}
