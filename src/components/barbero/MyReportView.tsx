'use client';

import { YO } from '@/lib/constants';
import { usePrintReport, useReport } from '@/hooks/useReport';
import { PanelShell } from '../layout/PanelShell';
import { Icon } from '../ui/Icon';
import { PageHeader } from '../ui/PageHeader';
import { DetalladoReport, PeriodControls } from '../shared/reports/Reports';

export function MyReportView() {
  const rp = useReport();
  const print = usePrintReport();
  return (
    <PanelShell rol="barbero" active="reportes">
      <PageHeader eyebrow="Ventas, servicios y liquidación" title="Mi reporte" />
      <section className="card" aria-label="Filtros del reporte">
        <PeriodControls params={rp.params} meses={rp.meses} onChange={rp.set} onPdf={() => print('detallado', rp.periodo.desde)}
          extra={<div className="field"><span>Barbero</span><span className="locked">Santiago Ríos (tú)<Icon name="lock" size={15} /></span></div>} />
      </section>
      <p className="muted" style={{ fontSize: 12, marginTop: -8 }}>Solo ves tus propias ventas y tu liquidación. Los reportes de la barbería y de otros barberos son del administrador.</p>
      <div id="report-preview"><DetalladoReport per={rp.periodo} r={rp.calc} bid={YO} vista="barbero" /></div>
    </PanelShell>
  );
}
