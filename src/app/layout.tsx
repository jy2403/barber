import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { Suspense } from 'react';
import { AppLoading, ClientApp } from '@/components/layout/ClientApp';
import './globals.css';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: { default: 'AURUM Barber Club', template: '%s · AURUM Barber Club' },
  description: 'AURUM Barber Club: landing, agendamiento en línea y paneles de administración y de barbero.',
};

export const viewport: Viewport = {
  themeColor: '#0d0d0e',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${cormorant.variable} ${manrope.variable}`}>
      <body>
        <Suspense fallback={<AppLoading />}>
          <ClientApp>{children}</ClientApp>
        </Suspense>
        <div id="print-root" />
        <noscript>
          <p style={{ padding: 24, color: '#f2ece0' }}>Activa JavaScript para ver la plataforma.</p>
        </noscript>
      </body>
    </html>
  );
}
