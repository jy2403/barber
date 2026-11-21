'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { RP_TIPOS } from '@/lib/constants';
import { RBASE } from '@/lib/domain/reports';
import { useBarberos } from '@/hooks/useBarberos';
import { usePrintReport, useReport } from '@/hooks/useReport';
import { PanelShell } from '../layout/PanelShell';
import { Icon } from '../ui/Icon';
import { Select } from '../ui/Form';
import { PageHeader } from '../ui/PageHeader';
import { ClientesReport, DetalladoReport, PeriodControls, ResumenReport } from '../shared/reports/Reports';

type Tipo = (typeof RP_TIPOS)[number][0];

export function ReportsView() {
  const q = useSearchParams();
  const { porId } = useBarberos();
  const rp = useReport();
  const print = usePrintReport();
  const tIni = q.get('t');
  const bIni = q.get('b');
  const [tipo, setTipo] = useState<Tipo>(RP_TIPOS.some((t) => t[0] === tIni) ? (tIni as Tipo) : 'resumen');
  const [bid, setBid] = useState(bIni && RBASE.barberos.includes(bIni) ? bIni : 'santiago');

  const selBarbero = tipo === 'detallado' && (
    <label className="field">Barbero
      <Select value={bid} onChange={(e) => setBid(e.target.value)}
        options={[...RBASE.barberos.map((id) => [id, porId(id)?.nombre || id] as [string, string]), ['todos', 'Todos (un reporte por barbero)']]} />
    </label>
  );

  return (
    <PanelShell rol="admin" active="reportes">
      <PageHeader eyebrow="Ver y descargar en PDF" title="Reportes" />
      <div className="rtypes" role="radiogroup" aria-label="Tipo de reporte">
        {RP_TIPOS.map(([id, t, d, ic]) => (
          <button key={id} type="button" className="rtype" role="radio" aria-checked={tipo === id} onClick={() => setTipo(id)}>
            <span className="rtype-ic"><Icon name={ic} size={20} /></span>
            <span><b>{t}</b><small>{d}</small></span>
          </button>
        ))}
      </div>
      <section className="card" aria-label="Filtros del reporte">
        <PeriodControls params={rp.params} meses={rp.meses} onChange={rp.set} extra={selBarbero} onPdf={() => print(tipo, rp.periodo.desde)} />
      </section>
      <div id="report-preview">
        {tipo === 'detallado' ? <DetalladoReport per={rp.periodo} r={rp.calc} bid={bid} vista="admin" />
          : tipo === 'clientes' ? <ClientesReport per={rp.periodo} r={rp.calc} />
          : <ResumenReport per={rp.periodo} r={rp.calc} />}
      </div>
    </PanelShell>
  );
}
