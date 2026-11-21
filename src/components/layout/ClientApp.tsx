'use client';

import { use, type ReactNode } from 'react';
import { browser } from 'react-dom';
import { DataProvider, useData } from '@/context/DataContext';
import { UIProvider } from '@/context/UIContext';

function Gate({ children }: { children: ReactNode }) {
  const { ready, error } = useData();
  if (error) return <p style={{ padding: 24, color: 'var(--bad)' }}>{error}</p>;
  if (!ready) return <AppLoading />;
  return <>{children}</>;
}

export function AppLoading() {
  return <div className="app-loading" role="status" aria-label="Cargando" />;
}

/**
 * La demostración depende de la fecha y hora del navegador (agenda de "hoy",
 * cupos libres…), así que la app se renderiza solo en el cliente.
 */
export function ClientApp({ children }: { children: ReactNode }) {
  use(browser('La agenda y los cupos dependen de la fecha y hora del navegador.'));
  return (
    <UIProvider>
      <DataProvider>
        <Gate>{children}</Gate>
      </DataProvider>
    </UIProvider>
  );
}
