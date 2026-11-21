'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { EstadoBarbero } from '@/types';
import { EST_B } from '@/lib/constants';
import { fDMA, norm, plural } from '@/lib/format';
import { notaEstado } from '@/lib/domain/availability';
import { useUI } from '@/context/UIContext';
import { useBarberos } from '@/hooks/useBarberos';
import { useServicios } from '@/hooks/useServicios';
import { PanelShell } from '../layout/PanelShell';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { MiniKpi, PageHeader } from '../ui/PageHeader';
import { Select } from '../ui/Form';

export function BarbersView() {
  const { barberos } = useBarberos();
  const { porId: sv } = useServicios();
  const { toast } = useUI();
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<'todos' | EstadoBarbero>('todos');

  const c = (e: EstadoBarbero[]) => barberos.filter((b) => e.includes(b.estado)).length;
  const nq = norm(q);
  const list = barberos.filter((b) => (estado === 'todos' || b.estado === estado) && (!nq || norm(b.nombre).includes(nq) || norm(b.doc).includes(nq) || norm(b.cel).includes(nq)));

  return (
    <PanelShell rol="admin" active="barberos" tb={<Link className="btn btn-icon tb-btn" href="/admin/barberos/nuevo" aria-label="Registrar barbero"><Icon name="plus" size={22} /></Link>}>
      <PageHeader eyebrow="Equipo" title="Barberos" actions={<Link className="btn btn-gold" href="/admin/barberos/nuevo"><Icon name="plus" size={18} />Registrar barbero</Link>} />
      <div className="mini-kpis">
        <MiniKpi label="Registrados" value={barberos.length} />
        <MiniKpi label="Activos" value={c(['activo'])} color="var(--ok)" />
        <MiniKpi label="Ausencias temporales" value={c(['vacaciones', 'incapacidad', 'suspendido'])} color="var(--warn)" />
        <MiniKpi label="Inactivos" value={c(['inactivo'])} color="var(--mute)" />
      </div>
      <section className="card" aria-label="Listado de barberos">
        <div className="toolbar">
          <label className="search"><Icon name="search" size={18} /><span className="sr-only">Buscar barbero</span><input type="search" value={q} placeholder="Nombre, documento o celular" onChange={(e) => setQ(e.target.value)} /></label>
          <label className="filter"><Icon name="filter" size={16} />Estado
            <Select value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)}
              options={[['todos', 'Todos'], ['activo', 'Activo'], ['vacaciones', 'Vacaciones'], ['incapacidad', 'Incapacidad o licencia'], ['suspendido', 'Suspendido'], ['inactivo', 'Inactivo (retirado)']]} />
          </label>
          <button type="button" className="btn btn-quiet" onClick={() => toast('Exportando el listado de barberos a Excel…', 'download')}><Icon name="download" size={18} />Exportar</button>
        </div>
        <div className="blist">
          <div className="bl-head"><span>Barbero</span><span>Documento</span><span>Celular</span><span>Servicios</span><span>Estado</span><span>Ingreso</span><span style={{ textAlign: 'right' }}>Acciones</span></div>
          {list.length ? list.map((b) => {
            const e = EST_B[b.estado];
            const nota = notaEstado(b);
            return (
              <div key={b.id} className={'brow' + (b.estado === 'inactivo' ? ' is-off' : '')}>
                <span className="c-who"><Avatar id={b.id} /><span><b>{b.nombre}</b><small>{b.esp}</small></span></span>
                <span className="c-doc"><span className="c-lbl">Documento</span><span className="num">{b.tipoDoc} {b.doc}</span></span>
                <span className="c-cel"><span className="c-lbl">Celular</span><span className="num">{b.cel}</span></span>
                <span className="c-serv"><span className="c-lbl">Servicios</span><span>{plural(b.ofrece.length, 'servicio', 'servicios')}<small>{b.ofrece.map((id) => sv(id)?.corto).join(' · ')}</small></span></span>
                <span className="c-est"><Badge cls={e.cls}>{e.txt}</Badge>{nota && <small>{nota}</small>}</span>
                <span className="c-ing"><span className="c-lbl">Ingreso</span><span>{fDMA(b.ingreso)}</span></span>
                <span className="c-act">
                  <Link className="btn btn-quiet btn-sm" href={'/admin/barberos/editar?b=' + b.id} aria-label={'Editar a ' + b.nombre}><Icon name="edit" size={16} /><span>Editar</span></Link>
                  <Link className="btn btn-quiet btn-sm" href={'/admin/reportes?t=detallado&b=' + b.id} aria-label={'Ver reporte de ' + b.nombre}><Icon name="report" size={16} /><span>Reporte</span></Link>
                </span>
              </div>
            );
          }) : (
            <div className="empty" style={{ gridColumn: '1/-1' }}><Icon name="search" size={26} /><b>No encontramos barberos con esos filtros</b><span>Revisa el nombre, documento o celular, o cambia el estado.</span></div>
          )}
        </div>
        <div className="list-foot">
          <span>Mostrando {list.length} de {barberos.length} barberos</span>
          <span>Los barberos inactivos no aparecen en la landing ni en el agendamiento, pero su historial se conserva.</span>
        </div>
      </section>
    </PanelShell>
  );
}
