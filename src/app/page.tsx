import type { Metadata } from 'next';
import { LandingView } from '@/components/landing/LandingView';

export const metadata: Metadata = { title: 'Barbería de autor' };

export default function Page() {
  return <LandingView />;
}
