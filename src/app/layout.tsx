import type { Metadata } from 'next';
import { Major_Mono_Display, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const majorMonoDisplay = Major_Mono_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NL → SQL — Tai Huynh',
  description:
    'Describe a query in plain English — get safe, read-only SQL for your schema. Powered by Gemini 2.5 Flash.',
  keywords: ['SQL', 'natural language', 'AI', 'database', 'query generation', 'Gemini'],
  authors: [{ name: 'Tai Huynh', url: 'https://github.com/0CCHacker' }],
  openGraph: {
    title: 'NL → SQL',
    description: 'Describe a query in plain English — get safe, read-only SQL for your schema.',
    url: 'https://github.com/0CCHacker',
    siteName: 'Tai Huynh',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${majorMonoDisplay.variable} ${ibmPlexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
