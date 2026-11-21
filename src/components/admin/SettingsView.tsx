'use client';

import { useState } from 'react';
import { CERRADO, FESTIVOS } from '@/lib/constants';
import { HOY, cap, fMedia, fromIso, iso } from '@/lib/format';
import { useUI } from '@/context/UIContext';
import { PanelShell } from '../layout/PanelShell';
import { AvatarIni } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Field, Select } from '../ui/Form';
import { Card, PageHeader } from '../ui/PageHeader';

const METODOS_CFG: [string, string][] = [['efectivo', 'Efectivo'], ['nequi', 'Nequi'], ['daviplata', 'Daviplata'], ['tarjeta', 'Tarjeta'], ['transferencia', 'Transferencia'], ['link', 'Link de pago']];

function Rule({ t, s, o }: { t: string; s: string; o: string[] }) {
  return <div className="rule"><span><b>{t}</b><small>{s}</small></span><Select options={o} aria-label={t} /></div>;
}

export function SettingsView() {
  const { toast } = useUI();
  const [metodos, setMetodos] = useState<Record<string, boolean>>({ efectivo: true, nequi: true, daviplata: true, tarjeta: true, transferencia: true, link: false });
  const [modal, setModal] = useState<'fest' | 'user' | null>(null);

  const fest = Object.keys(FESTIVOS).map((k) => fromIso(k)!).filter((d) => d >= HOY).slice(0, 4);
  const lista: [Date, string, string][] = fest.map((d) => [d, FESTIVOS[iso(d)], CERRADO[iso(d)] ? 'Cerrado' : 'Horario de festivo']);
  const nb = new Date(HOY.getFullYear(), 11, 24);
  if (nb >= HOY) lista.push([nb, 'Nochebuena', 'Cierra a las 2:00 p. m.']);
  lista.sort((a, z) => a[0].getTime() - z[0].getTime());

  const ok = (msg: string) => { setModal(null); toast(msg); };

  return (
    <PanelShell rol="admin" active="configuracion">
      <PageHeader eyebrow="Sistema" title="Configuración" actions={<button type="button" className="btn btn-gold" onClick={() => toast('Configuración guardada')}><Icon name="check" size={18} />Guardar cambios</button>} />
      <div className="cfg-grid">
        <Card title="Datos de la barbería">
          <div className="fgrid">
            <Field label="Nombre comercial"><input className="input" defaultValue="AURUM Barber Club" /></Field>
            <Field label="NIT"><input className="input" placeholder="000.000.000-0" /></Field>
            <Field label="Dirección"><input className="input" placeholder="Dirección completa" /></Field>
            <Field label="WhatsApp de la barbería"><input className="input" type="tel" placeholder="300 000 0000" /></Field>
            <Field label="Instagram"><input className="input" placeholder="@tubarberia" /></Field>
            <Field label="Comisión por defecto"><span className="igroup"><input type="number" defaultValue={50} aria-label="Comisión por defecto" /><span className="suf">%</span></span></Field>
          </div>
        </Card>
        <Card title="Reglas de agendamiento">
          <Rule t="Anticipación mínima" s="Hasta cuándo se puede reservar para hoy." o={['2 horas antes', '1 hora antes', '30 minutos antes']} />
          <Rule t="Ventana de reserva" s="Qué tan lejos se puede agendar." o={['30 días', '15 días', '60 días']} />
          <Rule t="Horas en el calendario" s="Cada cuánto se ofrece una hora de inicio." o={['Cada 30 minutos', 'Cada 15 minutos']} />
          <Rule t="Cancelación sin costo" s="Después, la cita cuenta como inasistencia." o={['Hasta 3 horas antes', 'Hasta 1 hora antes', 'Hasta 24 horas antes']} />
          <Rule t="Recordatorios por WhatsApp" s="Se piden confirmar con un toque." o={['24 h y 2 h antes', 'Solo 24 h antes', 'Desactivados']} />
          <Rule t="Clientes que no asisten" s="Qué pasa tras varias inasistencias." o={['Tras 2, confirmar por llamada', 'Tras 2, bloquear reservas en línea', 'Sin restricción']} />
        </Card>
        <Card title="Horario de atención" sub="Es el límite general: el horario de cada barbero va dentro de este.">
          <div className="rows">
            {[['Lunes a viernes', '9:00 a. m. – 8:00 p. m.'], ['Sábado', '8:00 a. m. – 7:00 p. m.'], ['Domingo y festivos', '10:00 a. m. – 3:00 p. m.']].map(([d, h]) => <div className="kv" key={d}><span>{d}</span><span>{h}</span></div>)}
          </div>
          <div className="fsub" style={{ marginTop: 14 }}>
            <span className="label-caps">Festivos y cierres especiales</span>
            {lista.map(([d, n, t]) => <div className="holi" key={iso(d)}><span>{cap(fMedia(d))} · {n}</span><span className={t === 'Cerrado' ? 'closed' : ''}>{t}</span></div>)}
            <button type="button" className="btn btn-dashed btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setModal('fest')}><Icon name="plus" size={16} />Agregar cierre o festivo</button>
          </div>
        </Card>
        <Card title="Usuarios y pagos">
          <div className="rows">
            {[['Laura Martínez', 'Administradora · acceso total'], ['Juliana Pérez', 'Recepción · agenda y ventas, sin reportes']].map(([n, r]) => (
              <div className="person-row" style={{ borderTop: 0 }} key={n}><AvatarIni name={n} /><span><b>{n}</b><small className="muted">{r}</small></span></div>
            ))}
          </div>
          <button type="button" className="btn btn-dashed btn-sm" style={{ margin: '10px 0 18px' }} onClick={() => setModal('user')}><Icon name="plus" size={16} />Invitar usuario</button>
          <div className="fsub">
            <span className="label-caps">Métodos de pago aceptados</span>
            <div className="chips">
              {METODOS_CFG.map(([id, t]) => <button key={id} type="button" className="chip" aria-pressed={metodos[id]} onClick={() => setMetodos({ ...metodos, [id]: !metodos[id] })}><Icon name="check" size={15} className="ck" />{t}</button>)}
            </div>
          </div>
        </Card>
      </div>

      {modal === 'fest' && (
        <Modal title="Agregar cierre o festivo" size="sm" onClose={() => setModal(null)}
          foot={<><button type="button" className="btn btn-quiet" onClick={() => setModal(null)}>Cancelar</button><button type="button" className="btn btn-gold" onClick={() => ok('Cierre agregado. Las horas de ese día dejan de ofrecerse al agendar.')}>Agregar</button></>}>
          <Field label="Fecha"><input className="input" type="date" min={iso(HOY)} /></Field>
          <Field label="Nombre"><input className="input" placeholder="Ej. Inventario anual" /></Field>
          <Field label="Tipo"><Select options={['Horario de festivo', 'Cerrado todo el día', 'Cierre temprano']} /></Field>
        </Modal>
      )}
      {modal === 'user' && (
        <Modal title="Invitar usuario" size="sm" onClose={() => setModal(null)}
          foot={<><button type="button" className="btn btn-quiet" onClick={() => setModal(null)}>Cancelar</button><button type="button" className="btn btn-gold" onClick={() => ok('Invitación enviada por correo')}><Icon name="mail" size={18} />Enviar invitación</button></>}>
          <Field label="Correo electrónico"><input className="input" type="email" placeholder="nombre@correo.com" /></Field>
          <Field label="Rol"><Select options={['Recepción · agenda y ventas', 'Administrador · acceso total']} /></Field>
        </Modal>
      )}
    </PanelShell>
  );
}
