import type { Metadata } from 'next';
import { BarbersView } from '@/components/admin/BarbersView';

export const metadata: Metadata = { title: 'Barberos' };

export default function Page() {
  return <BarbersView />;
}
