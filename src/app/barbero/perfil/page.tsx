import type { Metadata } from 'next';
import { MyProfileView } from '@/components/barbero/MyProfileView';

export const metadata: Metadata = { title: 'Mi perfil' };

export default function Page() {
  return <MyProfileView />;
}
