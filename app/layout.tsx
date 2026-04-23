import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientLayout from '../components/ClientLayout';
import { LangProvider } from '../components/LangProvider';
import PWARegister from '../components/PWARegister';

export const metadata: Metadata = {
  title: 'نظام الحضور والغياب',
  description: 'إدارة حضور وغياب العمال',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'الحضور',
  },
};

export const viewport: Viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="الحضور" />
      </head>
      <body className="min-h-screen bg-gray-100">
        <PWARegister />
        <LangProvider>
          <ClientLayout>{children}</ClientLayout>
        </LangProvider>
      </body>
    </html>
  );
}
