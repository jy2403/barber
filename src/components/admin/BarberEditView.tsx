'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Barbero, EstadoBarbero } from '@/types';
import { EST_B, EST_OPC } from '@/lib/constants';
import { HOY, MESES, addDays, cap, cop, fDM, fDeMes, fMedia, fromIso, hora, iso, plural } from '@/lib/format';
import { rpCalc, rpMeses, rpPeriodo } from '@/lib/domain/reports';
import { useData } from '@/context/DataContext';
import { useUI } from '@/context/UIContext';
import { useBarberos } from '@/hooks/useBarberos';
import { useScheduleEditor } from '@/hooks/useScheduleEditor';
import { useServicios } from '@/hooks/useServicios';
import { PanelShell } from '../layout/PanelShell';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Field, Select } from '../ui/Form';
import { ScheduleEditor } from '../shared/ScheduleEditor';

const AUSENCIAS: EstadoBarbero[] = ['vacaciones', 'incapacidad', 'suspendido'];

export function BarberEditView() {
  const q = useSearchParams();
  const { porId } = useBarberos();
  const b = porId(q.get('b')) || porId('andres');
  if (!b) return null;
  return <BarberEdit key={b.id} b={b} />;
}

function BarberEdit({ b }: { b: Barbero }) {
  const router = useRouter();
  const { toast } = useUI();
  const { barberos, servicios } = useData();
  const { activos, porId: sv } = useServicios();
  const { cambiarEstado } = useBarberos();
  const [estado, setEstado] = useState<EstadoBarbero>(b.estado);
  const [desde, setDesde] = useState(iso(b.vac ? b.vac.desde : HOY));
  const [hasta, setHasta] = useState(iso(b.vac ? b.vac.hasta : addDays(HOY, 7)));
  const [serv, setServ] = useState<Record<string, boolean>>(() => Object.fromEntries(b.ofrece.map((id) => [id, true])));
  const hz = useScheduleEditor(b, 'dia');

  const e = EST_B[b.estado];
  const r = useMemo(() => rpCalc(rpPeriodo({ modo: 'mes', mes: rpMeses()[1][0], desde: '', hasta: '' }), barberos, servicios).barberos[b.id], [barberos, servicios, b.id]);
  const mesAnt = MESES[new Date(HOY.getFullYear(), HOY.getMonth() - 1, 1).getMonth()];

  const guardar = async () => {
    try {
      await cambiarEstado(b.id, { estado, desde: fromIso(desde), hasta: fromIso(hasta), ofrece: Object.keys(serv).filter((k) => serv[k]), dias: hz.toHorario() });
      toast('Cambios de ' + b.nombre + ' guardados');
      router.push('/admin/barberos');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo guardar', 'alert');
    }
  };
  const btnGuardar = (txt: string) => <button type="button" className="btn btn-gold" onClick={guardar}><Icon name="check" size={18} />{txt}</button>;

  /* Panel adicional según el estado elegido */
  let extra = null;
  if (AUSENCIAS.includes(estado)) {
    const mot = ({ vacaciones: ['Observación', 'Ej. vacaciones aprobadas el ' + fDeMes(addDays(HOY, -16))], incapacidad: ['Motivo de la ausencia', 'Ej. incapacidad médica de 5 días'], suspendido: ['Motivo de la suspensión', 'Describe brevemente el motivo'] } as Record<string, [string, string]>)[estado];
    const d1 = fromIso(desde) || HOY;
    const fin = fromIso(hasta);
    const cs = ([[1, 600, 'Felipe Soto', 'Combo'], [3, 690, 'Juan Diego Mesa', 'Corte'], [5, 960, 'Óscar Pérez', 'Diseño de cejas']] as [number, number, string, string][])
      .map((x) => [addDays(d1 < HOY ? HOY : d1, x[0]), x[1], x[2], x[3]] as [Date, number, string, string])
      .filter((x) => !fin || x[0] <= fin);
    extra = (
      <div className="st-extra">
        <div className="fgrid-2">
          <Field label="Desde *"><input className="input" type="date" value={desde} onChange={(ev) => { setDesde(ev.target.value); if (hasta < ev.target.value) setHasta(ev.target.value); }} /></Field>
          <Field label="Hasta (incluido) *"><input className="input" type="date" value={hasta} min={desde} onChange={(ev) => setHasta(ev.target.value)} /></Field>
        </div>
        <Field label={mot[0]}><input className="input" placeholder={mot[1]} /></Field>
        {estado === 'incapacidad' && (
          <button type="button" className="btn btn-dashed" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Adjunta la incapacidad o el permiso en PDF', 'upload')}><Icon name="upload" size={16} />Adjuntar soporte (incapacidad o permiso)</button>
        )}
        {cs.length > 0 && (
          <div className="note note-warn" style={{ flexDirection: 'column', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--warn)', fontWeight: 800 }}><Icon name="alert" size={18} />{plural(cs.length, 'cita queda', 'citas quedan')} dentro de estas fechas</span>
            <span>{cs.map((x, i) => <span key={i}>{i > 0 && <br />}{cap(fMedia(x[0]))} · {hora(x[1])} · {x[2]} · {x[3]}</span>)}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => toast('Elige a qué barbero pasar cada cita', 'team')}>Reasignar a otro barbero</button>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => toast('Mensaje de reprogramación enviado por WhatsApp', 'wa')}>Avisar por WhatsApp para reprogramar</button>
            </div>
          </div>
        )}
      </div>
    );
  } else if (estado === 'inactivo') {
    extra = (
      <div className="st-extra">
        <div className="fgrid-2">
          <Field label="Fecha de retiro *"><input className="input" type="date" defaultValue={iso(HOY)} /></Field>
          <Field label="Motivo *"><Select options={['Renuncia voluntaria', 'Terminación del contrato', 'Fin de la prestación de servicios', 'Otro']} /></Field>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>Se desactiva su acceso al panel y se ocultará de la landing y del agendamiento. Sus ventas y reportes se conservan.</p>
      </div>
    );
  }

  return (
    <PanelShell rol="admin" active="barberos" sub back="/admin/barberos" tbTitle={b.nombre}
      savebar={<><Link className="btn btn-quiet" href={'/admin/reportes?t=detallado&b=' + b.id}>Ver reporte</Link>{btnGuardar('Guardar')}</>}>
      <div className="ph">
        <div className="ph-text"><nav className="crumbs" aria-label="Ruta"><Link href="/admin/barberos">Barberos</Link><span>/</span><span>{b.nombre}</span></nav></div>
        <div className="ph-actions ph-desk"><Link className="btn btn-quiet" href={'/admin/reportes?t=detallado&b=' + b.id}><Icon name="report" size={18} />Ver su reporte</Link>{btnGuardar('Guardar cambios')}</div>
      </div>

      <section className="banner" aria-label="Resumen del barbero">
        <Avatar id={b.id} className="av-xl" />
        <div className="banner-text">
          <div className="banner-name"><h1>{b.nombre}</h1><Badge cls={e.cls}>{e.txt}</Badge></div>
          <span style={{ color: 'var(--ink-2)' }}>{b.esp} · {b.tipoDoc} {b.doc} · {b.cel} · <span style={{ overflowWrap: 'anywhere' }}>{b.correo}</span></span>
          <span className="muted" style={{ fontSize: 13 }}>Barbero desde el {fDeMes(b.ingreso)} de {b.ingreso.getFullYear()} · Prestación de servicios · Comisión 50 %</span>
        </div>
        {r && (
          <div className="banner-stats">
            <div><span>Servicios en {mesAnt}</span><b>{r.serv}</b></div>
            <div><span>Ventas en {mesAnt}</span><b>{cop(r.netas)}</b></div>
          </div>
        )}
      </section>

      <div className="split">
        <section className="card card-pad" aria-labelledby="t-estado">
          <div className="card-head"><h2 className="card-title" id="t-estado">Estado del barbero</h2><span className="card-sub">Decide si aparece en la landing, si recibe citas y si puede entrar a su panel.</span></div>
          <div className="st-list" role="radiogroup" aria-label="Estado">
            {EST_OPC.map(([id, t, d, efectos]) => (
              <button key={id} type="button" className="st-opt" role="radio" aria-checked={estado === id} onClick={() => setEstado(id)}>
                <span className="radio-dot" />
                <span className="st-opt-text"><b><i style={{ background: EST_B[id].color }} />{t}</b><small>{d}</small></span>
                <span className="st-effects">{efectos.map((x) => <span key={x}>{x}</span>)}</span>
              </button>
            ))}
          </div>
          {extra}
        </section>

        <section className="card card-pad" aria-labelledby="t-info">
          <div className="card-head"><h2 className="card-title" id="t-info">Información</h2><Link className="link" href={'/admin/barberos/nuevo?b=' + b.id}><Icon name="edit" size={16} />Editar</Link></div>
          <dl className="dl">
            <div><dt>Documento</dt><dd>{b.tipoDoc} {b.doc}</dd></div>
            <div><dt>Nacimiento</dt><dd>{b.nac || '—'}</dd></div>
            <div><dt>Dirección</dt><dd>Cra. 00 # 00-00</dd></div>
            <div><dt>Emergencia</dt><dd>{b.emergencia || '—'}</dd></div>
            <div><dt>Vinculación</dt><dd>Prestación de servicios · quincenal</dd></div>
            <div><dt>Seguridad social</dt><dd>PILA de {mesAnt} cargada</dd></div>
            <div><dt>Pago de comisiones</dt><dd>Nequi · {b.cel.slice(0, 3)} *** {b.cel.slice(-4)}</dd></div>
            <div><dt>Documentos</dt><dd>4 de 5 cargados</dd></div>
          </dl>
          <div className="history">
            <span className="label-caps">Historial de cambios</span>
            <span><strong>{fDM(addDays(HOY, -16))}</strong> · Laura Martínez cambió el estado a {e.txt}.</span>
            <span><strong>{fDM(addDays(HOY, -65))}</strong> · {b.nombre} actualizó su horario del sábado.</span>
            {b.ofrece.length > 0 && <span><strong>{fDM(addDays(HOY, -83))}</strong> · Se agregó el servicio {sv(b.ofrece[b.ofrece.length - 1])?.nombre}.</span>}
          </div>
        </section>
      </div>

      <section className="card card-pad" aria-label="Horario"><ScheduleEditor hz={hz} /></section>

      <section className="card card-pad" aria-labelledby="t-serv">
        <div className="card-head"><h2 className="card-title" id="t-serv">Servicios que ofrece</h2><span className="card-sub">Toca un servicio para activarlo o quitarlo.</span></div>
        <div className="chips">
          {activos.map((s) => (
            <button key={s.id} type="button" className="chip" aria-pressed={!!serv[s.id]} onClick={() => setServ({ ...serv, [s.id]: !serv[s.id] })}><Icon name="check" size={15} className="ck" />{s.nombre}</button>
          ))}
        </div>
      </section>

      <div className="form-end"><Link className="btn btn-quiet" href="/admin/barberos">Cancelar</Link>{btnGuardar('Guardar cambios')}</div>
    </PanelShell>
  );
}
