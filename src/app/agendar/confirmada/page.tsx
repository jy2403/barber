import type { Metadata } from 'next';
import { ConfirmationView } from '@/components/booking/ConfirmationView';

export const metadata: Metadata = { title: 'Cita confirmada' };

export default function Page() {
  return <ConfirmationView />;
}
