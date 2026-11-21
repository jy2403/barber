'use client';

import { useRef, useState } from 'react';
import type { Servicio } from '@/types';
import { HOY, MESES, cop, fDM, miles, plural } from '@/lib/format';
import { useUI } from '@/context/UIContext';
import { useBarberos } from '@/hooks/useBarberos';
import { useServicios } from '@/hooks/useServicios';
import { PanelShell } from '../layout/PanelShell';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { DetailClose } from '../ui/DetailClose';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { PageHeader } from '../ui/PageHeader';
import { ServiceFormModal } from './ServiceFormModal';

export function ServicesView({ abrirNuevo = false }: { abrirNuevo?: boolean }) {
  const { servicios, porId, alternar } = useServicios();
  const { barberos, agendables, quitarServicio, asignarServicio } = useBarberos();
  const { toast, openSheet, closeSheet } = useUI();
  const detail = useRef<HTMLElement>(null);
  const [selId, setSelId] = useState('combo');
  const [form, setForm] = useState<{ s: Servicio | null } | null>(abrirNuevo ? { s: null } : null);
  const [asignar, setAsignar] = useState<Record<string, boolean> | null>(null);

  const s = porId(selId) || servicios[0];
  const ofrecen = (id: string) => barberos.filter((b) => b.estado !== 'inactivo' && b.ofrece.includes(id));
  const bs = ofrecen(s.id);
  const mesAnt = MESES[new Date(HOY.getFullYear(), HOY.getMonth() - 1, 1).getMonth()];
  const libres = agendables.filter((b) => !b.ofrece.includes(s.id));

  const nuevo = <button type="button" className="btn btn-icon tb-btn" onClick={() => setForm({ s: null })} aria-label="Nuevo servicio"><Icon name="plus" size={22} /></button>;

  return (
    <PanelShell rol="admin" active="servicios" tb={nuevo}>
      <PageHeader eyebrow="La carta de la casa" title="Servicios" actions={<button type="button" className="btn btn-gold" onClick={() => setForm({ s: null })}><Icon name="plus" size={18} />Nuevo servicio</button>} />
      <div className="md">
        <section aria-label="Lista de servicios">
          <div className="svc-list" role="list">
            {servicios.map((x) => (
              <button key={x.id} type="button" className={'svc-item' + (x.activo ? '' : ' is-off')} aria-pressed={x.id === s.id} onClick={() => { setSelId(x.id); setTimeout(() => openSheet(detail.current), 0); }}>
                <span className="svc-item-ic"><Icon name={x.icon} size={20} /></span>
                <span className="svc-item-text"><b>{x.nombre}</b><small>{x.dur} min · {plural(ofrecen(x.id).length, 'barbero', 'barberos')}</small></span>
                <span className="svc-item-end"><b>{cop(x.precio)}</b><Badge cls={x.activo ? 'b-ok' : ''}>{x.activo ? 'Activo' : 'Inactivo'}</Badge></span>
              </button>
            ))}
          </div>
        </section>
        <section className="card detail" id="detail" ref={detail} aria-label="Detalle del servicio">
          <span className="sheet-grip" />
          <div className="svc-detail-hero">
            <DetailClose />
            <div className="chips"><Badge cls={s.activo ? 'b-ok' : ''}>{s.activo ? 'Activo' : 'Inactivo'}</Badge><Badge cls="b-line" dot={false}>{s.cat}</Badge></div>
            <h2>{s.nombre}</h2>
            <p>{s.desc}</p>
          </div>
          <div className="stat4">
            <div><span>Precio de venta</span><b>{cop(s.precio)}</b></div>
            <div><span>Duración</span><b>{s.dur} min</b></div>
            <div><span>Vendidos en {mesAnt}</span><b>{miles(s.vendidos)}</b></div>
            <div><span>Ingresos en {mesAnt}</span><b>{cop(s.ingresos)}</b></div>
          </div>
          <div className="card-pad stack-v detail-pad-b">
            <div className="card-head" style={{ marginBottom: 0 }}>
              <h3 className="card-title" style={{ fontSize: 22 }}>Barberos que lo ofrecen · {bs.length}</h3>
              <button type="button" className="btn btn-dashed btn-sm" onClick={() => setAsignar({})}><Icon name="plus" size={16} />Asignar barbero</button>
            </div>
            <div>
              {bs.length ? bs.map((b) => (
                <div className="person-row" key={b.id}>
                  <Avatar id={b.id} />
                  <span><b>{b.nombre}</b><small style={{ color: b.estado === 'activo' ? 'var(--ok)' : 'var(--warn)' }}>{b.estado === 'activo' ? 'Activo' : b.vac ? 'De vacaciones hasta el ' + fDM(b.vac.hasta) + '.' : '—'}</small></span>
                  <button type="button" className="btn btn-quiet btn-sm" onClick={async () => { await quitarServicio(b.id, s.id); toast(b.nombre + ' ya no ofrece ' + s.nombre.toLowerCase()); }}>Quitar</button>
                </div>
              )) : (
                <p className="note note-warn"><Icon name="alert" size={18} /><span>Ningún barbero ofrece este servicio. Mientras esté así, no aparece en el agendamiento.</span></p>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button type="button" className="btn btn-gold" onClick={() => { closeSheet(); setForm({ s }); }}><Icon name="edit" size={16} />Editar servicio</button>
              <button type="button" className={'btn ' + (s.activo ? 'btn-danger' : 'btn-quiet')} onClick={async () => { const x = await alternar(s.id); toast(x.nombre + (x.activo ? ' activado: ya se puede agendar.' : ' desactivado: ya no aparece en la landing ni al agendar.')); }}>
                {s.activo ? 'Desactivar servicio' : 'Activar servicio'}
              </button>
            </div>
            <p className="muted" style={{ fontSize: 12 }}>Un cambio de precio aplica a citas y ventas nuevas. Lo ya registrado conserva su valor.</p>
          </div>
        </section>
      </div>

      {form && <ServiceFormModal s={form.s} onClose={() => setForm(null)} onSaved={(x) => { setSelId(x.id); setForm(null); }} />}

      {asignar && (
        <Modal title="Asignar barbero" size="sm" onClose={() => setAsignar(null)}
          foot={<>
            <button type="button" className="btn btn-quiet" onClick={() => setAsignar(null)}>Cancelar</button>
            {libres.length > 0 && (
              <button type="button" className="btn btn-gold" onClick={async () => {
                const ids = Object.keys(asignar).filter((k) => asignar[k]);
                setAsignar(null);
                if (ids.length) { await asignarServicio(s.id, ids); toast(plural(ids.length, 'barbero asignado', 'barberos asignados')); }
              }}>Asignar</button>
            )}
          </>}>
          {libres.length ? (
            <div className="checks" style={{ gridTemplateColumns: '1fr' }}>
              {libres.map((b) => (
                <label className="checkcard" key={b.id}>
                  <input type="checkbox" checked={!!asignar[b.id]} onChange={(e) => setAsignar({ ...asignar, [b.id]: e.target.checked })} />
                  <Avatar id={b.id} className="av-sm" />
                  <span><b>{b.nombre}</b><small>{b.esp}</small></span>
                </label>
              ))}
            </div>
          ) : <p className="muted">Todos los barberos activos ya ofrecen este servicio.</p>}
        </Modal>
      )}
    </PanelShell>
  );
}
