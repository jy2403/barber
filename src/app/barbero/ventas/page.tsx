import type { Metadata } from 'next';
import { MySalesView } from '@/components/barbero/MySalesView';

export const metadata: Metadata = { title: 'Mis ventas' };

export default function Page() {
  return <MySalesView />;
}
