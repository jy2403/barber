'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type InputHTMLAttributes } from 'react';
import type { Barbero } from '@/types';
import { fotoUrl } from '@/lib/assets';
import { HOY, cop, iso } from '@/lib/format';
import { scrollBehavior, useUI } from '@/context/UIContext';
import { useBarberForm, type BarberFormValues } from '@/hooks/useBarberForm';
import { useBarberos } from '@/hooks/useBarberos';
import { useServicios } from '@/hooks/useServicios';
import { PanelShell } from '../layout/PanelShell';
import { Icon } from '../ui/Icon';
import { Field, Select, ToggleRow } from '../ui/Form';
import { ScheduleEditor } from '../shared/ScheduleEditor';

const SECCIONES: [string, string][] = [['sec-personal', 'Datos personales'], ['sec-contacto', 'Contacto'], ['sec-perfil', 'Perfil para la landing'], ['sec-contratacion', 'Contratación y pago'], ['sec-seguridad', 'Seguridad social'], ['sec-horario', 'Horario'], ['sec-servicios', 'Servicios'], ['sec-documentos', 'Documentos']];
const DOCS: [string, string, string][] = [['id', 'Documento de identidad *', 'PDF o imagen, ambas caras'], ['contrato', 'Contrato firmado', 'PDF'], ['hv', 'Hoja de vida', 'PDF'], ['cert', 'Certificados', 'Bioseguridad, cursos de barbería'], ['afil', 'Afiliaciones', 'EPS, ARL o planilla PILA']];
const TOGGLES: ['landing' | 'online' | 'panel', string, string][] = [['landing', 'Mostrar en la landing', 'Aparece en la sección “El equipo”.'], ['online', 'Recibe citas en línea', 'Los clientes pueden elegirlo al agendar.'], ['panel', 'Acceso al panel de barbero', 'Le enviamos un correo para crear su contraseña. Solo verá su perfil, sus citas, sus ventas y su reporte.']];

export function BarberFormView() {
  const q = useSearchParams();
  const { porId } = useBarberos();
  const b = q.get('b') ? porId(q.get('b')) : undefined;
  return <BarberForm key={b?.id || 'nuevo'} b={b} />;
}

function BarberForm({ b }: { b: Barbero | undefined }) {
  const router = useRouter();
  const { toast } = useUI();
  const { activos } = useServicios();
  const f = useBarberForm(b);
  const [secActiva, setSecActiva] = useState<string | null>(null);
  const { v } = f;

  const back = b ? '/admin/barberos/editar?b=' + b.id : '/admin/barberos';
  const titulo = b ? 'Datos de ' + b.nombre : 'Registrar barbero';

  const guardar = async () => {
    const r = await f.guardar();
    if ('falta' in r) {
      const e = document.getElementById('bn-' + r.falta);
      e?.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
      setTimeout(() => e?.focus({ preventScroll: true }), 300);
      toast('Completa los campos obligatorios marcados en rojo.', 'alert');
      return;
    }
    if (r.nuevo) {
      toast('Barbero registrado. Le enviamos la invitación al panel a ' + r.barbero.correo, 'mail');
      router.push('/admin/barberos');
    } else {
      toast('Datos de ' + r.barbero.nombre + ' actualizados');
      router.push('/admin/barberos/editar?b=' + r.barbero.id);
    }
  };

  const inp = (k: keyof BarberFormValues, extra: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input className="input" id={'bn-' + k} value={v[k]} aria-invalid={f.invalid[k] || undefined} onChange={(e) => f.set(k, e.target.value)} {...extra} />
  );
  const grupo = (k: keyof BarberFormValues, pre: string | null, extra: InputHTMLAttributes<HTMLInputElement> = {}, suf?: string) => (
    <span className="igroup" aria-invalid={f.invalid[k] || undefined}>
      {pre && <span>{pre}</span>}
      <input id={'bn-' + k} value={v[k]} onChange={(e) => f.set(k, e.target.value)} {...extra} />
      {suf && <span className="suf">{suf}</span>}
    </span>
  );
  const btnGuardar = (txt: string) => <button type="button" className="btn btn-gold" onClick={guardar}><Icon name="check" size={18} />{txt}</button>;

  const nombrePrev = (v.nom.trim() + ' ' + v.ape.trim()).trim() || (b ? b.nombre : 'Nombre del barbero');

  return (
    <PanelShell rol="admin" active="barberos" sub back={back} tbTitle={b ? 'Editar datos' : 'Registrar barbero'}
      savebar={<><Link className="btn btn-quiet" href={back}>Cancelar</Link>{btnGuardar('Guardar')}</>}>
      <div className="ph">
        <div className="ph-text">
          <nav className="crumbs" aria-label="Ruta"><Link href="/admin/barberos">Barberos</Link><span>/</span><span>{b ? b.nombre : 'Registrar barbero'}</span></nav>
          <h1 className="ph-title">{titulo}</h1>
        </div>
        <div className="ph-actions ph-desk"><Link className="btn btn-quiet" href={back}>Cancelar</Link>{btnGuardar(b ? 'Guardar cambios' : 'Guardar barbero')}</div>
      </div>

      <nav className="secnav" aria-label="Secciones del formulario">
        <div className="chips-scroll">
          {SECCIONES.map(([id, t]) => (
            <button key={id} type="button" className="chip chip-pill" aria-pressed={secActiva === id} onClick={() => { setSecActiva(id); document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }); }}>{t}</button>
          ))}
        </div>
      </nav>

      <div className="flayout">
        <section className="card card-pad f-photo" aria-label="Foto de perfil">
          <div className="photo-card">
            <h2 className="card-title">Foto de perfil *</h2>
            {b
              ? <span className="av av-xl" style={{ width: 160, height: 200, borderRadius: 4 }}><img src={fotoUrl(b.id)} alt={'Foto actual de ' + b.nombre} /></span>
              : <div className="photo-drop"><Icon name="camera" size={28} /><span>Arrastra la foto aquí</span></div>}
            <div className="photo-meta">
              <button type="button" className="btn btn-quiet" onClick={() => toast('Selecciona una foto vertical con fondo neutro', 'camera')}>{b ? 'Cambiar foto' : 'Subir foto'}</button>
              <span className="muted" style={{ fontSize: 12, maxWidth: 300 }}>JPG o PNG vertical, mínimo 800 × 1000 px y fondo neutro. Se muestra en la landing y al agendar.</span>
            </div>
          </div>
        </section>

        <form className="f-form" aria-label="Datos del barbero" noValidate onSubmit={(e) => e.preventDefault()}>
          <section className="card card-pad fsec" id="sec-personal">
            <h2 className="fsec-title"><Icon name="idcard" size={22} />Datos personales</h2>
            <div className="fgrid fgrid-3">
              <Field label="Tipo de documento *"><Select id="bn-tdoc" value={v.tdoc} onChange={(e) => f.set('tdoc', e.target.value)} options={[['CC', 'CC · Ciudadanía'], ['CE', 'CE · Extranjería'], ['PPT', 'PPT · Protección temporal'], ['PA', 'PA · Pasaporte']]} /></Field>
              <Field label="Número de documento *">{inp('doc', { inputMode: 'numeric', placeholder: 'Sin puntos ni espacios' })}</Field>
              <Field label="Fecha de nacimiento *"><input className="input" type="date" /></Field>
              <Field label="Nombres *">{inp('nom', { autoComplete: 'off', placeholder: 'Ej. Santiago Andrés' })}</Field>
              <Field label="Apellidos *">{inp('ape', { autoComplete: 'off', placeholder: 'Ej. Ríos Ocampo' })}</Field>
              <Field label="Grupo sanguíneo y RH"><Select defaultValue={b ? 'O+' : 'Seleccionar'} options={['Seleccionar', 'O+', 'O−', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−']} /></Field>
            </div>
            <div className="fgrid">
              <Field label="Dirección de residencia *"><input className="input" placeholder="Calle, número, barrio" autoComplete="off" defaultValue={b ? 'Cra. 00 # 00-00' : ''} /></Field>
              <Field label="Ciudad *"><input className="input" placeholder="Ciudad de residencia" defaultValue={b ? '[Ciudad]' : ''} /></Field>
            </div>
          </section>

          <section className="card card-pad fsec" id="sec-contacto">
            <h2 className="fsec-title"><Icon name="phone" size={22} />Contacto</h2>
            <div className="fgrid">
              <Field label="Celular (WhatsApp) *">{grupo('cel', '+57', { type: 'tel', inputMode: 'numeric', placeholder: '300 123 4567' })}</Field>
              <Field label="Correo electrónico *" hint="También será su usuario para entrar al panel.">{inp('mail', { type: 'email', placeholder: 'nombre@correo.com' })}</Field>
            </div>
            <div className="fsub">
              <span className="label-caps">Contacto de emergencia</span>
              <div className="fgrid fgrid-3">
                <Field label="Nombre completo"><input className="input" placeholder="Persona a contactar" defaultValue={b?.emergencia ? b.emergencia.split(' (')[0] : ''} /></Field>
                <Field label="Parentesco"><Select options={['Seleccionar', 'Madre o padre', 'Pareja', 'Hermano(a)', 'Hijo(a)', 'Otro']} /></Field>
                <Field label="Celular"><input className="input" type="tel" placeholder="300 123 4567" defaultValue={b?.emergencia ? b.emergencia.split('· ')[1] : ''} /></Field>
              </div>
            </div>
          </section>

          <section className="card card-pad fsec" id="sec-perfil">
            <div>
              <h2 className="fsec-title"><Icon name="scissors" size={22} />Perfil para la landing</h2>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Lo que verán los clientes en la sección de barberos y al agendar.</p>
            </div>
            <div className="fgrid fgrid-3">
              <Field label="Especialidad *">{inp('esp', { placeholder: 'Ej. Fades y degradados' })}</Field>
              <Field label="Años de experiencia">{inp('anos', { type: 'number', min: 0, placeholder: 'Ej. 5' })}</Field>
              <Field label="Instagram">{grupo('ig', '@', { placeholder: 'usuario' })}</Field>
            </div>
            <Field label="Biografía corta" hint={<><span>{v.bio.length}</span> de 160 caracteres</>}>
              <textarea className="textarea" rows={3} maxLength={160} placeholder="Dos líneas sobre su estilo y experiencia" value={v.bio} onChange={(e) => f.set('bio', e.target.value)} />
            </Field>
          </section>

          <section className="card card-pad fsec" id="sec-contratacion">
            <h2 className="fsec-title"><Icon name="briefcase" size={22} />Contratación y pago</h2>
            <div className="fgrid fgrid-3">
              <Field label="Fecha de ingreso *"><input className="input" type="date" defaultValue={b ? iso(b.ingreso) : iso(HOY)} /></Field>
              <Field label="Tipo de vinculación *"><Select options={['Prestación de servicios', 'Contrato laboral a término indefinido', 'Contrato laboral a término fijo', 'Arriendo de silla']} /></Field>
              <Field label="Fin del contrato" hint="Solo para término fijo o prestación con fecha."><input className="input" type="date" /></Field>
              <Field label="Esquema de pago *"><Select options={['Comisión por servicio', 'Salario fijo + comisión', 'Arriendo fijo de silla']} /></Field>
              <Field label="Comisión para el barbero *" hint="Se usa para calcular su liquidación en los reportes.">
                <span className="igroup"><input type="number" min={0} max={100} defaultValue={50} aria-label="Porcentaje de comisión" /><span className="suf">%</span></span>
              </Field>
              <Field label="Periodo de liquidación"><Select options={['Quincenal', 'Semanal', 'Mensual']} /></Field>
            </div>
            <div className="fsub">
              <span className="label-caps">¿Dónde le pagamos?</span>
              <div className="fgrid fgrid-3">
                <Field label="Medio de pago"><Select defaultValue={b ? 'Nequi' : 'Transferencia bancaria'} options={['Transferencia bancaria', 'Nequi', 'Daviplata', 'Efectivo']} /></Field>
                <Field label="Banco y tipo de cuenta"><input className="input" placeholder="Ej. Bancolombia · Ahorros" /></Field>
                <Field label="Número de cuenta o celular"><input className="input" inputMode="numeric" placeholder="Número" defaultValue={b ? b.cel : ''} /></Field>
              </div>
            </div>
          </section>

          <section className="card card-pad fsec" id="sec-seguridad">
            <div>
              <h2 className="fsec-title"><Icon name="shield" size={22} />Seguridad social</h2>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Obligatoria con contrato laboral. En prestación de servicios, guarda cada mes la planilla PILA como soporte.</p>
            </div>
            <div className="fgrid">
              <Field label="EPS"><input className="input" placeholder="Entidad de salud" /></Field>
              <Field label="Fondo de pensiones"><input className="input" placeholder="Fondo" /></Field>
              <Field label="ARL (riesgos laborales)"><input className="input" placeholder="Aseguradora de riesgos" /></Field>
              <Field label="Caja de compensación"><input className="input" placeholder="Solo contrato laboral" /></Field>
            </div>
          </section>

          <section className="card card-pad fsec" id="sec-horario" aria-label="Horario"><ScheduleEditor hz={f.hz} /></section>

          <section className="card card-pad fsec" id="sec-servicios">
            <div className="hz-head">
              <div>
                <h2 className="fsec-title"><Icon name="sparkle" size={22} />Servicios que ofrece</h2>
                <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Solo aparecen los servicios activos. El cliente solo podrá elegirlo para estos servicios.</p>
              </div>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => f.setServ(Object.fromEntries(activos.map((s) => [s.id, true])))}>Seleccionar todos</button>
            </div>
            <div className="checks">
              {activos.map((s) => (
                <label className="checkcard" key={s.id}>
                  <input type="checkbox" checked={!!f.serv[s.id]} onChange={(e) => f.setServ({ ...f.serv, [s.id]: e.target.checked })} />
                  <span><b>{s.nombre}</b><small>{s.dur} min · {cop(s.precio)}</small></span>
                </label>
              ))}
            </div>
          </section>

          <section className="card card-pad fsec" id="sec-documentos">
            <h2 className="fsec-title"><Icon name="clip" size={22} />Documentos</h2>
            <div className="uploads">
              {DOCS.map(([k, t, h]) => (
                <button key={k} type="button" className={'upload' + (f.docs[k] ? ' is-done' : '')} onClick={() => f.setDocs({ ...f.docs, [k]: !f.docs[k] })}>
                  <Icon name={f.docs[k] ? 'check' : 'upload'} size={20} /><b>{t}</b><small>{f.docs[k] ? 'Cargado · toca para quitar' : h}</small>
                </button>
              ))}
            </div>
          </section>

          <div className="form-end"><Link className="btn btn-quiet" href={back}>Cancelar</Link>{btnGuardar(b ? 'Guardar cambios' : 'Guardar barbero')}</div>
        </form>

        <aside className="f-aside" aria-label="Vista previa y acceso">
          <section className="card card-pad">
            <h2 className="card-title" style={{ marginBottom: 14 }}>Así se verá en la landing</h2>
            <div className="preview">
              <div className="preview-photo">
                {b && <img src={fotoUrl(b.id)} alt="" style={{ position: 'absolute', inset: 'auto 0 0 0', width: '100%' }} />}
                <span className="btag">{v.esp.trim() || (b ? b.esp : 'Especialidad')}</span>
                {!b && <span>La foto aparece aquí</span>}
              </div>
              <div className="bbody" style={{ paddingBottom: 16 }}>
                <span className="bname" style={{ fontSize: 24 }}>{nombrePrev}</span>
                <span className="muted" style={{ fontSize: 13 }}>{v.anos.trim() ? v.anos.trim() + ' años de oficio' : 'Años de oficio'} · {v.ig.trim() ? '@' + v.ig.trim().replace(/^@/, '') : '@instagram'}</span>
              </div>
            </div>
          </section>
          <section className="card card-pad">
            <h2 className="card-title" style={{ marginBottom: 6 }}>Visibilidad y acceso</h2>
            <div className="toggles">
              {TOGGLES.map(([k, t, d]) => <ToggleRow key={k} title={t} desc={d} checked={f.toggles[k]} onChange={(val) => f.setToggles({ ...f.toggles, [k]: val })} />)}
            </div>
          </section>
        </aside>
      </div>
    </PanelShell>
  );
}
