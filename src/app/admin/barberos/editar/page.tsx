import type { Metadata } from 'next';
import { BarberEditView } from '@/components/admin/BarberEditView';

export const metadata: Metadata = { title: 'Editar barbero' };

export default function Page() {
  return <BarberEditView />;
}
