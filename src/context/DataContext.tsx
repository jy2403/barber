'use client';

/* =========================================================
   Contexto de datos: caché compartida de las entidades que
   devuelve el backend. Los hooks leen de aquí y, después de
   cada mutación, piden recargar solo lo que cambió.
   ========================================================= */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Barbero, Bloqueo, Cita, Cliente, Confirmacion, Servicio, Venta } from '@/types';
import { listarServicios } from '@/services/servicios.service';
import { listarBarberos } from '@/services/barberos.service';
import { listarClientes } from '@/services/clientes.service';
import { obtenerAgendaDia, obtenerBloqueosHoy } from '@/services/citas.service';
import { listarVentasHoy, obtenerSiguienteTicket } from '@/services/ventas.service';
import { HOY } from '@/lib/format';

interface Entidades {
  servicios: Servicio[];
  barberos: Barbero[];
  clientes: Cliente[];
  agendaHoy: Cita[];
  bloqueos: Bloqueo[];
  ventas: Venta[];
  ticket: number;
}
export type Entidad = keyof Entidades;

interface DataValue extends Entidades {
  ready: boolean;
  error: string | null;
  /** Vuelve a pedir al backend las entidades indicadas */
  reload: (...keys: Entidad[]) => Promise<void>;
  /** Última reserva confirmada en el sitio público */
  confirmada: Confirmacion | null;
  setConfirmada: (c: Confirmacion | null) => void;
}

const LOADERS: { [K in Entidad]: () => Promise<Entidades[K]> } = {
  servicios: listarServicios,
  barberos: listarBarberos,
  clientes: listarClientes,
  agendaHoy: () => obtenerAgendaDia(HOY),
  bloqueos: obtenerBloqueosHoy,
  ventas: listarVentasHoy,
  ticket: obtenerSiguienteTicket,
};
const TODAS = Object.keys(LOADERS) as Entidad[];

/** Pide al backend las entidades indicadas */
async function cargar(ks: Entidad[]): Promise<Partial<Entidades>> {
  const vals = await Promise.all(ks.map((k) => LOADERS[k]()));
  const out: Partial<Record<Entidad, unknown>> = {};
  ks.forEach((k, i) => { out[k] = vals[i]; });
  return out as Partial<Entidades>;
}

const VACIO: Entidades = { servicios: [], barberos: [], clientes: [], agendaHoy: [], bloqueos: [], ventas: [], ticket: 0 };

const DataContext = createContext<DataValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Entidades>(VACIO);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState<Confirmacion | null>(null);

  const reload = useCallback(async (...keys: Entidad[]) => {
    try {
      const parcial = await cargar(keys.length ? keys : TODAS);
      setData((prev) => ({ ...prev, ...parcial }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar los datos');
    }
  }, []);

  /* Carga inicial */
  useEffect(() => {
    let vivo = true;
    cargar(TODAS)
      .then((d) => { if (vivo) { setData((prev) => ({ ...prev, ...d })); setReady(true); } })
      .catch((e) => { if (vivo) setError(e instanceof Error ? e.message : 'No pudimos cargar los datos'); });
    return () => { vivo = false; };
  }, []);

  const value = useMemo<DataValue>(() => ({ ...data, ready, error, reload, confirmada, setConfirmada }), [data, ready, error, reload, confirmada]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de <DataProvider>');
  return ctx;
}
