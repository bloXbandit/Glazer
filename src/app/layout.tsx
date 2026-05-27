import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GlazePro Estimator — DMV Commercial Glazing',
  description: 'Professional commercial glazing estimating platform for the DC, Maryland, and Virginia market.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#0f1117] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
