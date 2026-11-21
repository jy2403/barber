'use client';

import { useState } from 'react';
import type { Barbero } from '@/types';
import { EST_B, HORAS_OPC, YO } from '@/lib/constants';
import { HOY, addDays, cap, cop, fDeMes, fMedia, fMesA, fromIso, hora, iso } from '@/lib/format';
import { useUI } from '@/context/UIContext';
import { useBarberos } from '@/hooks/useBarberos';
import { useBloqueosPersonales } from '@/hooks/useBloqueosPersonales';
import { useScheduleEditor } from '@/hooks/useScheduleEditor';
import { useServicios } from '@/hooks/useServicios';
import { PanelShell } from '../layout/PanelShell';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Field, Select } from '../ui/Form';
import { ScheduleEditor } from '../shared/ScheduleEditor';

export function MyProfileView() {
  const { porId } = useBarberos();
  const b = porId(YO);
  if (!b) return null;
  return <MyProfile b={b} />;
}

function MyProfile({ b }: { b: Barbero }) {
  const { toast } = useUI();
  const { activos } = useServicios();
  const { actualizar } = useBarberos();
  const [serv, setServ] = useState<Record<string, boolean>>(() => Object.fromEntries(b.ofrece.map((id) => [id, true])));
  const { bloqueos: ordenados, crear: crearBloqueo, eliminar: eliminarBloqueo } = useBloqueosPersonales(YO);
  const [modal, setModal] = useState<'corr' | 'bloq' | null>(null);
  const [nb, setNb] = useState({ d: iso(addDays(HOY, 1)), a: 840, z: 960, m: 'Cita médica', err: '' });
  const hz = useScheduleEditor(b, 'dia');

  const guardar = async () => {
    await actualizar(YO, { ofrece: Object.keys(serv).filter((k) => serv[k]), dias: hz.toHorario() });
    toast('Perfil actualizado. El administrador recibe un aviso de los cambios.');
  };
  const agregarBloqueo = async () => {
    const d = fromIso(nb.d);
    if (!d || nb.z <= nb.a) { setNb({ ...nb, err: !d ? 'Elige una fecha.' : 'La hora final debe ser posterior a la inicial.' }); return; }
    await crearBloqueo({ d, a: nb.a, z: nb.z, m: nb.m });
    setModal(null);
    toast('Horario bloqueado el ' + fDeMes(d));
  };

  return (
    <PanelShell rol="barbero" active="perfil">
      <section className="banner" aria-label="Mi perfil">
        <Avatar id={YO} className="av-xl" />
        <div className="banner-text">
          <span className="ph-eyebrow">Mi perfil</span>
          <div className="banner-name"><h1>{b.nombre}</h1><Badge cls={EST_B[b.estado].cls}>{EST_B[b.estado].txt}</Badge></div>
          <span className="muted">{b.esp} · Barbero desde {fMesA(b.ingreso)} · {b.ig}</span>
        </div>
        <button type="button" className="btn btn-gold" onClick={guardar}><Icon name="check" size={18} />Guardar cambios</button>
      </section>

      <div className="grid-2">
        <section className="card card-pad" aria-labelledby="t-info">
          <div className="card-head"><h2 className="card-title" id="t-info">Mi información</h2><span className="badge b-line"><Icon name="lock" size={13} />Solo lectura</span></div>
          <dl className="dl-grid">
            <div><dt>Documento</dt><dd>{b.tipoDoc} {b.doc}</dd></div>
            <div><dt>Fecha de nacimiento</dt><dd>{b.nac}</dd></div>
            <div><dt>Celular</dt><dd>{b.cel}</dd></div>
            <div><dt>Correo</dt><dd>{b.correo}</dd></div>
            <div><dt>Contacto de emergencia</dt><dd>{b.emergencia?.split(' · ')[0] || '—'}</dd></div>
            <div><dt>Vinculación</dt><dd>Prestación de servicios</dd></div>
            <div><dt>Comisión</dt><dd>50 % por servicio · liquidación quincenal</dd></div>
            <div><dt>Pago de comisiones</dt><dd>Nequi · {b.cel.slice(0, 3)} *** {b.cel.slice(-4)}</dd></div>
          </dl>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 }}>
            <span className="muted" style={{ fontSize: 13 }}>Solo el administrador puede cambiar estos datos.</span>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setModal('corr')}>Pedir una corrección</button>
          </div>
        </section>
        <section className="card card-pad" aria-labelledby="t-serv">
          <div className="card-head"><h2 className="card-title" id="t-serv">Servicios que ofrezco</h2><span className="card-sub">Los clientes solo te ven disponible para estos servicios.</span></div>
          <div className="checks">
            {activos.map((s) => (
              <label className="checkcard" key={s.id}>
                <input type="checkbox" checked={!!serv[s.id]} onChange={(e) => setServ({ ...serv, [s.id]: e.target.checked })} />
                <span><b>{s.nombre}</b><small>{s.dur} min · {cop(s.precio)}</small></span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <section className="card card-pad" aria-label="Horario de trabajo"><ScheduleEditor hz={hz} /></section>

      <section className="card card-pad" aria-labelledby="t-bloq">
        <div className="card-head">
          <div><h2 className="card-title" id="t-bloq">Bloqueos puntuales</h2><span className="card-sub">Para una diligencia o una cita médica. Vacaciones e incapacidades se solicitan al administrador.</span></div>
          <button type="button" className="btn btn-dashed btn-sm" onClick={() => { setNb({ d: iso(addDays(HOY, 1)), a: 840, z: 960, m: 'Cita médica', err: '' }); setModal('bloq'); }}><Icon name="plus" size={16} />Bloquear un horario</button>
        </div>
        {ordenados.length ? (
          <div className="rows">
            {ordenados.map((x) => (
              <div className="kv" style={{ alignItems: 'center' }} key={x.id}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, color: 'var(--ink)' }}><b>{cap(fMedia(x.d))}</b><small className="muted">{hora(x.a)} – {hora(x.z)} · {x.m}</small></span>
                <button type="button" className="btn btn-icon btn-quiet" aria-label={'Quitar bloqueo del ' + fDeMes(x.d)} onClick={async () => { await eliminarBloqueo(x.id); toast('Bloqueo del ' + fDeMes(x.d) + ' eliminado'); }}><Icon name="trash" size={17} /></button>
              </div>
            ))}
          </div>
        ) : <p className="muted">No tienes bloqueos programados.</p>}
        <p className="note" style={{ marginTop: 14 }}><Icon name="info" size={18} /><span>Si cambias tu horario o bloqueas horas en las que ya tienes citas, te mostramos cuáles son antes de guardar y el administrador recibe un aviso.</span></p>
      </section>

      {modal === 'corr' && (
        <Modal title="Pedir una corrección" size="sm" onClose={() => setModal(null)}
          foot={<><button type="button" className="btn btn-quiet" onClick={() => setModal(null)}>Cancelar</button><button type="button" className="btn btn-gold" onClick={() => { setModal(null); toast('Solicitud enviada al administrador'); }}>Enviar solicitud</button></>}>
          <Field label="Dato a corregir"><Select options={['Celular', 'Correo', 'Contacto de emergencia', 'Medio de pago de comisiones', 'Otro']} /></Field>
          <Field label="¿Qué debe decir?"><textarea className="textarea" rows={3} placeholder="Escribe el dato correcto" /></Field>
        </Modal>
      )}
      {modal === 'bloq' && (
        <Modal title="Bloquear un horario" size="sm" onClose={() => setModal(null)}
          foot={<><button type="button" className="btn btn-quiet" onClick={() => setModal(null)}>Cancelar</button><button type="button" className="btn btn-gold" onClick={agregarBloqueo}>Bloquear</button></>}>
          <Field label="Fecha"><input className="input" type="date" min={iso(HOY)} value={nb.d} onChange={(e) => setNb({ ...nb, d: e.target.value, err: '' })} /></Field>
          <div className="fgrid-2">
            <Field label="Desde"><Select options={HORAS_OPC} value={nb.a} onChange={(e) => setNb({ ...nb, a: +e.target.value, err: '' })} /></Field>
            <Field label="Hasta"><Select options={HORAS_OPC} value={nb.z} onChange={(e) => setNb({ ...nb, z: +e.target.value, err: '' })} /></Field>
          </div>
          <Field label="Motivo"><Select options={['Cita médica', 'Diligencia personal', 'Capacitación', 'Otro']} value={nb.m} onChange={(e) => setNb({ ...nb, m: e.target.value })} /></Field>
          <span className="field"><span className="err">{nb.err}</span></span>
        </Modal>
      )}
    </PanelShell>
  );
}
