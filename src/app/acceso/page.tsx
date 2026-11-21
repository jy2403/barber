import type { Metadata } from 'next';
import { LoginView } from '@/components/auth/LoginView';

export const metadata: Metadata = { title: 'Acceso del equipo' };

export default function Page() {
  return <LoginView />;
}
