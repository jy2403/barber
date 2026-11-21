'use client';

import type { CSSProperties, ReactNode, SelectHTMLAttributes } from 'react';

/** Campo con etiqueta, ayuda opcional y error */
export function Field({ label, children, hint, error, className = '', htmlFor }: { label?: ReactNode; children: ReactNode; hint?: ReactNode; error?: string; className?: string; htmlFor?: string }) {
  return (
    <label className={'field' + (className ? ' ' + className : '')} htmlFor={htmlFor}>
      {label}
      {children}
      {hint && <span className="hint">{hint}</span>}
      {error !== undefined && <span className="err" aria-live="polite">{error}</span>}
    </label>
  );
}

type Opt = [string | number, string] | string;

/** Select con opciones como [valor, texto] o texto simple */
export function Select({ options, ...rest }: { options: Opt[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className="select" {...rest}>
      {options.map((o) => {
        const [v, t] = Array.isArray(o) ? o : [o, o];
        return <option key={String(v)} value={v}>{t}</option>;
      })}
    </select>
  );
}

/** Interruptor accesible (role="switch") */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" className="switch" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} />;
}

/** Control segmentado */
export function Seg<T extends string>({ value, options, onChange, label, role = 'group', className = '' }: { value: T; options: [T, ReactNode][]; onChange: (v: T) => void; label: string; role?: 'group' | 'tablist'; className?: string }) {
  return (
    <div className={'seg' + (className ? ' ' + className : '')} role={role} aria-label={label}>
      {options.map(([v, t]) =>
        role === 'tablist' ? (
          <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)}>{t}</button>
        ) : (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{t}</button>
        ),
      )}
    </div>
  );
}

/** Interruptor con título y descripción */
export function ToggleRow({ title, desc, checked, onChange, style }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void; style?: CSSProperties }) {
  return (
    <div className="toggle-row" style={style}>
      <span><b>{title}</b><small>{desc}</small></span>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}
