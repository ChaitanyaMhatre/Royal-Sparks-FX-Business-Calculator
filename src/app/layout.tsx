import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BusinessStoreProvider } from '@/lib/store';
import AuthShell from '@/components/auth/AuthShell';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Royal Sparks FX - Business Manager',
  description: 'Celebrating Your Special Moments - Centralized Event, Expense, Profit & Financial Management Platform',
  manifest: '/manifest.json',
  icons: {
    icon: '/assets/royal-sparks-fx-logo.jpeg',
    apple: '/assets/royal-sparks-fx-logo.jpeg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Royal Sparks FX',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/assets/royal-sparks-fx-logo.jpeg" />
      </head>
      <body className="bg-black text-white min-h-screen antialiased">
        <BusinessStoreProvider>
          <AuthShell>{children}</AuthShell>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: '#151515',
                borderColor: '#2A2A2A',
                color: '#ffffff',
              },
            }}
          />
        </BusinessStoreProvider>
      </body>
    </html>
  );
}
