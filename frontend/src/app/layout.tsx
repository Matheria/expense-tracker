import type { Metadata } from 'next';
import './globals.css';
import { Geist, Manrope } from 'next/font/google';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const manrope = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Трекер расходов',
  description: 'Следите за доходами и расходами без лишнего',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={cn(geist.variable, manrope.variable)}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
