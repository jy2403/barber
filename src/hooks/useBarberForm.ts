'use client';

import { useState } from 'react';
import type { Barbero } from '@/types';
import { digits } from '@/lib/format';
import { useBarberos } from './useBarberos';
import { useScheduleEditor } from './useScheduleEditor';

export interface BarberFormValues {
  tdoc: string;
  doc: string;
  nom: string;
  ape: string;
  cel: string;
  mail: string;
  esp: string;
  anos: string;
  ig: string;
  bio: string;
}
type Campo = keyof BarberFormValues;

const REQ_NUEVO: Campo[] = ['doc', 'nom', 'ape', 'cel', 'mail', 'esp'];
const REQ_EDIT: Campo[] = ['nom', 'ape', 'cel', 'mail', 'esp'];

/** Formulario de registro o edición de datos de un barbero */
export function useBarberForm(b: Barbero | undefined) {
  const { crear, actualizar } = useBarberos();
  const nom = b ? b.nombre.split(' ') : [];
  const [v, setV] = useState<BarberFormValues>({
    tdoc: b?.tipoDoc || 'CC', doc: b ? digits(b.doc) : '', nom: nom[0] || '', ape: nom.slice(1).join(' '), cel: b?.cel || '', mail: b?.correo || '',
    esp: b?.esp || '', anos: b ? String(parseInt(b.exp, 10)) : '', ig: b ? b.ig.replace('@', '') : '', bio: '',
  });
  const [invalid, setInvalid] = useState<Partial<Record<Campo, boolean>>>({});
  const [serv, setServ] = useState<Record<string, boolean>>(() => Object.fromEntries((b ? b.ofrece : ['corte', 'barba', 'combo']).map((id) => [id, true])));
  const [toggles, setToggles] = useState({ landing: true, online: true, panel: true });
  const [docs, setDocs] = useState<Record<string, boolean>>(b ? { id: true, contrato: true, hv: true, afil: true } : {});
  const hz = useScheduleEditor(b, b ? 'dia' : 'semana');

  const set = (k: Campo, val: string) => {
    setV((p) => ({ ...p, [k]: val }));
    if (invalid[k]) setInvalid((p) => ({ ...p, [k]: false }));
  };

  /** Valida y guarda. Devuelve el campo faltante o el barbero guardado. */
  const guardar = async (): Promise<{ falta: Campo } | { barbero: Barbero; nuevo: boolean }> => {
    const req = b ? REQ_EDIT : REQ_NUEVO;
    const inv = Object.fromEntries(req.map((k) => [k, !v[k].trim()])) as Partial<Record<Campo, boolean>>;
    setInvalid(inv);
    const falta = req.find((k) => inv[k]);
    if (falta) return { falta };
    const payload = {
      nombre: v.nom.trim() + ' ' + v.ape.trim(),
      corto: v.nom.trim().split(' ')[0],
      esp: v.esp.trim(),
      exp: v.anos.trim(),
      ig: v.ig.trim(),
      tipoDoc: v.tdoc,
      doc: v.doc.trim(),
      cel: v.cel.trim(),
      correo: v.mail.trim(),
      ofrece: Object.keys(serv).filter((k) => serv[k]),
      dias: hz.toHorario(),
    };
    if (b) return { barbero: await actualizar(b.id, payload), nuevo: false };
    return { barbero: await crear(payload), nuevo: true };
  };

  return { v, set, invalid, serv, setServ, toggles, setToggles, docs, setDocs, hz, guardar };
}
