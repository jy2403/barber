import type { Metadata } from 'next';
import { ReportsView } from '@/components/admin/ReportsView';

export const metadata: Metadata = { title: 'Reportes' };

export default function Page() {
  return <ReportsView />;
}
