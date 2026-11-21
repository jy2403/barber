import type { ReactNode } from 'react';

/** Encabezado de página del panel */
export function PageHeader({ eyebrow, title, actions }: { eyebrow: ReactNode; title: ReactNode; actions?: ReactNode }) {
  return (
    <div className="ph">
      <div className="ph-text">
        <span className="ph-eyebrow">{eyebrow}</span>
        <h1 className="ph-title">{title}</h1>
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </div>
  );
}

/** Tarjeta con título */
export function Card({ title, sub, children, className = '', id }: { title: ReactNode; sub?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section className={'card card-pad ' + className} id={id} aria-label={typeof title === 'string' ? title : undefined}>
      <div className="card-head">
        <h2 className="card-title">{title}</h2>
        {sub && <span className="card-sub">{sub}</span>}
      </div>
      {children}
    </section>
  );
}

export function MiniKpi({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div className="mini-kpi">
      <span>{color && <i style={{ background: color }} />}{label}</span>
      <b>{value}</b>
    </div>
  );
}
