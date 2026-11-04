import type { Metadata } from 'next';
import './globals.css';
import { CrmLayout } from '@/components/CrmLayout';

export const metadata: Metadata = {
  metadataBase: new URL('https://hr-motor.vercel.app'),
  title: 'HR MOTOR — Showroom Mobil Bekas Garut',
  description: 'Sistem Manajemen Showroom Terpadu HR MOTOR Garut, Jawa Barat.',
  manifest: '/manifest.webmanifest?v=8',
  icons: {
    icon: [
      { url: '/favicon.ico?v=8', sizes: 'any' },
      { url: '/icon-192.png?v=8', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png?v=8', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=8', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png?v=8', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=8',
  },
  openGraph: {
    title: 'HR MOTOR — Showroom Mobil Bekas Garut',
    description: 'Sistem Manajemen Showroom Terpadu HR MOTOR Garut, Jawa Barat.',
    images: [{ url: '/icon-512.png?v=8', width: 512, height: 512, alt: 'HR MOTOR' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HR MOTOR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=8" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png?v=8" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png?v=8" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=8" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=8" />
      </head>
      <body className="antialiased font-sans bg-[#F8F7F4] text-[#202020]">
        <CrmLayout>{children}</CrmLayout>
      </body>
    </html>
  );
}
