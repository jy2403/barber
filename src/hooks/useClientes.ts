'use client';

import { useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { digits, norm } from '@/lib/format';
import { buscarClientePorCelular } from '@/services/clientes.service';

export function useClientes() {
  const { clientes } = useData();
  const porNombre = useCallback((nombre: string) => clientes.find((c) => c.nombre === nombre), [clientes]);

  /** Sugerencias por nombre o celular (máx. 4) */
  const sugerir = useCallback(
    (q: string) => {
      const n = norm(q);
      if (!n) return [];
      return clientes.filter((c) => norm(c.nombre).indexOf(n) >= 0 || digits(c.cel).indexOf(digits(q) || '#') >= 0).slice(0, 4);
    },
    [clientes],
  );

  return { clientes, porNombre, sugerir, buscarPorCelular: buscarClientePorCelular };
}
