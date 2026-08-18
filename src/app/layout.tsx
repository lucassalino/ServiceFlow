import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Anton } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

/** Display condensada da marca — usada na landing e nos ecrãs de entrada. */
const anton = Anton({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--wis-display' });

export const metadata: Metadata = {
  metadataBase: new URL('https://wis-services.com'),
  title: 'WIS — Worship In Sync',
  description: 'Gestão de ministérios e escalas para igrejas',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'WIS' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'WIS — Worship In Sync',
    description: 'Gestão de ministérios e escalas para igrejas',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0D3B66',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
