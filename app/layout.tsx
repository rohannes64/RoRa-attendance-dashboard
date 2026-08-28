import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FaceAttend — Biometric Attendance System',
  description: 'Real-time face recognition and automated biometric attendance system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#140E07] text-[#F0E2C8] antialiased h-full overflow-x-hidden selection:bg-[#C4622D]/30 selection:text-[#F0E2C8]">
        {children}
      </body>
    </html>
  );
}
