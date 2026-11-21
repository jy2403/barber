'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Barbero, Confirmacion, Servicio } from '@/types';
import { useData } from '@/context/DataContext';
import { agendables, mesesReserva, proximaHora, slots, slotsDe } from '@/lib/domain/availability';
import { digits, fDM, sameDay } from '@/lib/format';
import { buscarClientePorCelular } from '@/services/clientes.service';
import { crearReserva } from '@/services/citas.service';

export interface BookingForm {
  nombre: string;
  cel: string;
  correo: string;
  nac: string;
  nota: string;
  rec: boolean;
  acepta: boolean;
}
export type BookingErrors = Partial<Record<'cel' | 'nombre' | 'correo' | 'acepta', string>>;

/**
 * Estado y reglas del agendamiento en línea. El usuario elige servicio,
 * barbero, mes, día y hora; lo que no eligió (o dejó de ser válido) se
 * completa con la primera opción disponible.
 */
export function useBooking(init: { s?: string | null; b?: string | null }) {
  const { servicios, barberos, setConfirmada } = useData();
  const [svcId, setSvcId] = useState(init.s || 'combo');
  const [barberId, setBarberId] = useState(init.b || 'cualquier');
  const [mesSel, setMesSel] = useState<Date | null>(null);
  const [diaSel, setDiaSel] = useState<Date | null>(null);
  const [horaSel, setHoraSel] = useState<number | null>(null);
  const [form, setForm] = useState<BookingForm>({ nombre: '', cel: '', correo: '', nac: '', nota: '', rec: true, acepta: false });
  const [errors, setErrors] = useState<BookingErrors>({});
  const [conocido, setConocido] = useState<string | null>(null);

  const n = useMemo(() => {
    const SV = (id: string) => servicios.find((s) => s.id === id);
    const elegido = SV(svcId);
    const sv = (elegido && elegido.activo ? elegido : SV('combo') || servicios[0]) as Servicio;
    let bid = barberId;
    const b = barberos.find((x) => x.id === bid);
    if (b && (b.ofrece.indexOf(sv.id) < 0 || b.estado !== 'activo')) bid = 'cualquier';
    if (bid !== 'cualquier' && !b) bid = 'cualquier';
    const meses = mesesReserva();
    const mes = mesSel && meses.some((m) => sameDay(m, mesSel)) ? mesSel : meses[0];
    const enMes = (d: Date) => d.getMonth() === mes.getMonth() && d.getFullYear() === mes.getFullYear();
    let dia: Date | null = diaSel;
    if (!(dia && enMes(dia) && slots(barberos, bid, sv, dia).length)) {
      dia = null;
      const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
      for (let k = 1; k <= total; k++) {
        const d = new Date(mes.getFullYear(), mes.getMonth(), k);
        if (slots(barberos, bid, sv, d).length) { dia = d; break; }
      }
    }
    const libres = dia ? slots(barberos, bid, sv, dia) : [];
    const hora = horaSel !== null && libres.indexOf(horaSel) >= 0 ? horaSel : libres.length ? libres[0] : null;
    const barbero = barberos.find((x) => x.id === bid) || null;
    const asignado: Barbero | null = bid === 'cualquier' && dia && hora !== null ? agendables(barberos).find((x) => slotsDe(x, sv, dia!).indexOf(hora) >= 0) || null : null;
    return { sv, bid, barbero, meses, mes, dia, libres, hora, asignado };
  }, [servicios, barberos, svcId, barberId, mesSel, diaSel, horaSel]);

  const opcionesBarbero = useMemo(
    () => [
      { id: 'cualquier', b: null as Barbero | null, nota: proximaHora(barberos, null, n.sv), disabled: false, cls: '' },
      ...agendables(barberos).map((b) => {
        if (b.estado === 'vacaciones' && b.vac) return { id: b.id, b, nota: 'De vacaciones hasta el ' + fDM(b.vac.hasta) + '.', disabled: true, cls: 'warn' };
        if (b.ofrece.indexOf(n.sv.id) < 0) return { id: b.id, b, nota: 'No realiza este servicio', disabled: true, cls: 'mute' };
        return { id: b.id, b, nota: proximaHora(barberos, b, n.sv), disabled: false, cls: '' };
      }),
    ],
    [barberos, n.sv],
  );

  /** Horas libres de un día del calendario */
  const cuposDe = useCallback((d: Date) => slots(barberos, n.bid, n.sv, d).length, [barberos, n.bid, n.sv]);

  const elegirServicio = (id: string) => setSvcId(id);
  const elegirBarbero = (id: string) => setBarberId(id);
  const moverMes = (delta: number) => {
    const i = n.meses.findIndex((x) => sameDay(x, n.mes)) + delta;
    if (n.meses[i]) { setMesSel(n.meses[i]); setDiaSel(null); }
  };
  const elegirDia = (d: Date) => { setDiaSel(d); setMesSel(new Date(d.getFullYear(), d.getMonth(), 1)); };
  const elegirHora = (h: number) => { setHoraSel(h); if (n.dia) setDiaSel(n.dia); };

  const setCampo = async <K extends keyof BookingForm>(k: K, v: BookingForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k in errors) setErrors((e) => ({ ...e, [k]: '' }));
    if (k === 'cel') {
      const c = await buscarClientePorCelular(String(v));
      if (c && conocido !== c.nombre) {
        setConocido(c.nombre);
        setForm((f) => ({ ...f, nombre: c.nombre, correo: c.correo }));
        setErrors((e) => ({ ...e, nombre: '', correo: '' }));
      } else if (!c && conocido) setConocido(null);
    }
  };

  /** Devuelve el primer campo inválido o null */
  const validar = (): keyof BookingErrors | null => {
    const e: BookingErrors = {
      cel: /^3\d{9}$/.test(digits(form.cel)) ? '' : 'Escribe un celular colombiano de 10 dígitos.',
      nombre: form.nombre.trim().split(/\s+/).length >= 2 ? '' : 'Escribe tu nombre y apellido.',
      correo: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.correo.trim()) ? '' : 'Escribe un correo válido, por ejemplo nombre@correo.com.',
      acepta: form.acepta ? '' : 'Necesitamos tu autorización para agendar.',
    };
    setErrors(e);
    return (['cel', 'nombre', 'correo', 'acepta'] as const).find((k) => e[k]) || null;
  };

  const confirmar = async (): Promise<Confirmacion> => {
    const c = await crearReserva({
      nombre: form.nombre, cel: digits(form.cel), correo: form.correo, nac: form.nac, nota: form.nota, recordatorio: form.rec,
      servicioId: n.sv.id, barberoId: n.barbero?.id || n.asignado?.id || 'santiago', dia: n.dia!, hora: n.hora!,
    });
    setConfirmada(c);
    return c;
  };

  return {
    ...n,
    activos: servicios.filter((s) => s.activo),
    opcionesBarbero,
    cuposDe,
    form,
    errors,
    conocido,
    elegirServicio,
    elegirBarbero,
    moverMes,
    elegirDia,
    elegirHora,
    setCampo,
    validar,
    confirmar,
  };
}
