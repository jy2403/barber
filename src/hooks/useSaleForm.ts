'use client';

import { useMemo, useState } from 'react';
import type { Cita, DescuentoId, MetodoPago, Rol, Venta } from '@/types';
import { YO } from '@/lib/constants';
import { cop, digits, ticketTxt } from '@/lib/format';
import { calcularVenta, citasCobrables, clienteResumen, horaTicket, porAtender, type ClienteVenta } from '@/lib/domain/sales';
import { useData } from '@/context/DataContext';
import { useUI } from '@/context/UIContext';
import { useVentas } from './useVentas';

type ModoCliente = 'registrado' | 'nuevo' | 'ocasional';

interface SaleState {
  citas: Cita[];
  cita: number;
  modo: ModoCliente;
  cliente: ClienteVenta | null;
  q: string;
  nuevo: { nombre: string; cel: string; correo: string };
  b: string;
  items: string[];
  desc: DescuentoId;
  motivo: string;
  propina: number;
  metodo: MetodoPago;
  err: string;
}

const LIMPIO = { cita: -1, modo: 'ocasional' as ModoCliente, cliente: null, q: '', nuevo: { nombre: '', cel: '', correo: '' }, items: [], desc: 'no' as DescuentoId, propina: 0, metodo: 'efectivo' as MetodoPago, err: '' };

/** Lógica del formulario "Registrar venta" (administrador y barbero) */
export function useSaleForm(rol: Rol, citaId: string | null, onSaved?: (v: Venta) => void) {
  const { agendaHoy, clientes, servicios, barberos } = useData();
  const { ticket, registrar } = useVentas();
  const { toast } = useUI();

  const resumenDeCita = (c: Cita): ClienteVenta => {
    const k = clientes.find((x) => x.nombre === c.cliente);
    if (k) return clienteResumen(k);
    const nueva = /primera|nuevo/i.test(c.hist);
    return { nombre: c.cliente, detalle: c.tel + ' · ' + (nueva ? 'primera visita' : c.hist), seg: nueva ? 'nuevo' : 'recurrente' };
  };
  const cargar = (st: SaleState, i: number): SaleState => {
    const c = st.citas[i];
    if (!c) return st;
    return { ...st, cita: i, modo: 'registrado', cliente: resumenDeCita(c), q: '', b: c.b, items: c.items.slice(), err: '' };
  };

  const [s, setS] = useState<SaleState>(() => {
    const citas = citasCobrables(agendaHoy, rol, YO);
    let st: SaleState = { ...LIMPIO, citas, b: YO, motivo: 'Cliente frecuente' };
    if (citas.length) st = cargar(st, 0);
    st = { ...st, propina: 2000, metodo: 'nequi' };
    if (citaId !== null) {
      const c = agendaHoy.find((x) => x.id === citaId && (rol === 'admin' || x.b === YO));
      if (c && porAtender(c)) {
        let i = st.citas.indexOf(c);
        if (i < 0) { st = { ...st, citas: [c, ...st.citas] }; i = 0; }
        st = cargar(st, i);
      }
    }
    return st;
  });
  const set = (p: Partial<SaleState>) => setS((prev) => ({ ...prev, ...p }));

  const barbero = barberos.find((b) => b.id === s.b);
  const ofrecidos = useMemo(() => servicios.filter((x) => x.activo && !!barbero && barbero.ofrece.indexOf(x.id) >= 0), [servicios, barbero]);
  const calc = calcularVenta(servicios, s.items, s.desc, s.propina);

  const acciones = {
    cargarCita: (i: number) => setS((prev) => cargar(prev, i)),
    setModo: (modo: ModoCliente) => set({ modo }),
    limpiarCliente: () => set({ cliente: null, q: '' }),
    setQ: (q: string) => set({ q }),
    elegirCliente: (nombre: string) => {
      const k = clientes.find((c) => c.nombre === nombre);
      if (k) set({ cliente: clienteResumen(k) });
    },
    setNuevo: (k: 'nombre' | 'cel' | 'correo', v: string) => setS((prev) => ({ ...prev, nuevo: { ...prev.nuevo, [k]: v } })),
    setBarbero: (b: string) => {
      const off = barberos.find((x) => x.id === b)?.ofrece || [];
      setS((prev) => ({ ...prev, b, items: prev.items.filter((id) => off.indexOf(id) >= 0) }));
    },
    addItem: (id: string) => setS((prev) => ({ ...prev, items: [...prev.items, id], err: '' })),
    delItem: (i: number) => setS((prev) => ({ ...prev, items: prev.items.filter((_, k) => k !== i) })),
    setDesc: (desc: DescuentoId) => set({ desc }),
    setMotivo: (motivo: string) => set({ motivo }),
    setPropina: (propina: number) => set({ propina }),
    setMetodo: (metodo: MetodoPago) => set({ metodo }),
    limpiar: () => set({ ...LIMPIO }),
  };

  /** Registra la venta. Devuelve false si falta algo. */
  const guardar = async (): Promise<boolean> => {
    if (!s.items.length) { set({ err: 'Agrega al menos un servicio antes de registrar la venta.' }); return false; }
    if (s.modo === 'nuevo' && (s.nuevo.nombre.trim().split(/\s+/).length < 2 || digits(s.nuevo.cel).length !== 10)) {
      toast('Escribe nombre completo y un celular de 10 dígitos para el cliente nuevo.', 'alert');
      return false;
    }
    const nombre = s.modo === 'registrado' && s.cliente ? s.cliente.nombre : s.modo === 'nuevo' ? s.nuevo.nombre.trim() : 'Cliente ocasional';
    const cita = s.cita >= 0 ? s.citas[s.cita] : undefined;
    const v = await registrar({
      t: horaTicket(ticket), cliente: nombre, b: s.b, items: s.items.slice(), desc: s.desc, propina: s.propina, metodo: s.metodo,
      citaId: cita?.id, clienteNuevo: s.modo === 'nuevo' ? { ...s.nuevo, nombre } : undefined,
    });
    toast('Venta #' + ticketTxt(v.ticket) + ' registrada · ' + cop(v.total));
    const agenda = agendaHoy.map((c) => (cita && c.id === cita.id ? { ...c, est: 'atendida' as const } : c));
    const citas = citasCobrables(agenda, rol, YO);
    setS((prev) => {
      let st: SaleState = { ...prev, ...LIMPIO, citas };
      if (citas.length) st = cargar(st, 0);
      return st;
    });
    onSaved?.(v);
    return true;
  };

  return { s, rol, ticket, horaTicket: horaTicket(ticket), barbero, ofrecidos, calc, ...acciones, guardar };
}

export type SaleFormApi = ReturnType<typeof useSaleForm>;
