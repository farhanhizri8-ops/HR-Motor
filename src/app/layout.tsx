import type { Metadata } from 'next';
import './globals.css';
import { CrmLayout } from '@/components/CrmLayout';

export const metadata: Metadata = {
  title: 'HR MOTOR CRM — Dealership Mobil Bekas Garut',
  description: 'Sistem Manajemen Hubungan Pelanggan (CRM) Terpadu HR MOTOR Garut, Jawa Barat.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased font-sans bg-slate-50 text-slate-900">
        <CrmLayout>{children}</CrmLayout>
      </body>
    </html>
  );
}
