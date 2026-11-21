import type { Metadata } from 'next';
import { ServicesView } from '@/components/admin/ServicesView';

export const metadata: Metadata = { title: 'Nuevo servicio' };

export default function Page() {
  return <ServicesView abrirNuevo />;
}
