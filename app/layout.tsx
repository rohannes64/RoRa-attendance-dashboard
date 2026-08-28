import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FaceLog — Real-Time Face Recognition Attendance',
  description: 'Production-grade, edge-computed face recognition attendance system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0d1b3e] text-[#f0f6ff] antialiased overflow-hidden selection:bg-teal-500/30 selection:text-teal-200">
        {children}
      </body>
    </html>
  );
}
