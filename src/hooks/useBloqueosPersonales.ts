'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BloqueoPersonal } from '@/types';
import { crearBloqueoPersonal, eliminarBloqueoPersonal, listarBloqueosPersonales } from '@/services/barberos.service';

/** Bloqueos puntuales de la agenda de un barbero */
export function useBloqueosPersonales(barberoId: string) {
  const [bloqueos, setBloqueos] = useState<BloqueoPersonal[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vivo = true;
    listarBloqueosPersonales(barberoId).then((l) => { if (vivo) setBloqueos(l); });
    return () => { vivo = false; };
  }, [barberoId, version]);

  const crear = useCallback(async (d: Omit<BloqueoPersonal, 'id' | 'b'>) => {
    const x = await crearBloqueoPersonal(barberoId, d);
    setVersion((v) => v + 1);
    return x;
  }, [barberoId]);

  const eliminar = useCallback(async (id: string) => {
    await eliminarBloqueoPersonal(id);
    setVersion((v) => v + 1);
  }, []);

  const ordenados = bloqueos.slice().sort((x, y) => x.d.getTime() - y.d.getTime() || x.a - y.a);
  return { bloqueos: ordenados, crear, eliminar };
}
