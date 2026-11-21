import type { Metadata } from 'next';
import { BookingView } from '@/components/booking/BookingView';

export const metadata: Metadata = { title: 'Agenda tu cita' };

export default function Page() {
  return <BookingView />;
}
