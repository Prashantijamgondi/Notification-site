//import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OneSignal Test App',
  description: 'Simple local test app for OneSignal web push',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
