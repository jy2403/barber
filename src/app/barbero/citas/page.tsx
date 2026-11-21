import type { Metadata } from 'next';
import { MyAppointmentsView } from '@/components/barbero/MyAppointmentsView';

export const metadata: Metadata = { title: 'Mis citas' };

export default function Page() {
  return <MyAppointmentsView />;
}
