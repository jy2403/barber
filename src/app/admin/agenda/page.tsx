import type { Metadata } from 'next';
import { AgendaView } from '@/components/admin/AgendaView';

export const metadata: Metadata = { title: 'Agenda de citas' };

export default function Page() {
  return <AgendaView />;
}
