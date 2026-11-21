import type { Metadata } from 'next';
import { MyReportView } from '@/components/barbero/MyReportView';

export const metadata: Metadata = { title: 'Mi reporte' };

export default function Page() {
  return <MyReportView />;
}
