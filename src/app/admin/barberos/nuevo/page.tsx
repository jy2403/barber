import type { Metadata } from 'next';
import { BarberFormView } from '@/components/admin/BarberFormView';

export const metadata: Metadata = { title: 'Registrar barbero' };

export default function Page() {
  return <BarberFormView />;
}
