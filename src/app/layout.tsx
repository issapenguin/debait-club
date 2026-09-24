import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.debait.club'),
  title: {
    default: 'Debait Club — Change your mind weekly',
    template: '%s — Debait Club',
  },
  description:
    'A weekly debate club. One fresh topic per category, every week. Read the FOR and AGAINST cases, vote, join the discussion, and stay open to changing your mind.',
  keywords: [
    'debate',
    'weekly debate',
    'debate club',
    'opposing views',
    'change your mind',
    'politics debate',
    'sports debate',
    'civil discourse',
  ],
  authors: [{ name: 'Debait Club' }],
  creator: 'Debait Club',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.debait.club',
    siteName: 'Debait Club',
    title: 'Debait Club — Change your mind weekly',
    description:
      'One fresh debate topic per category, every week. Read both sides. Make your case. Change your mind.',
  },
  twitter: {
    card: 'summary',
    title: 'Debait Club — Change your mind weekly',
    description:
      'One fresh debate topic per category, every week. Read both sides. Make your case. Change your mind.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.debait.club',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Debait Club',
  url: 'https://www.debait.club',
  description:
    'A weekly debate club. One fresh topic per category, every week. Read the FOR and AGAINST cases, vote, and stay open to changing your mind.',
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem('debait-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body
        className={`${fraunces.variable} ${inter.variable} flex min-h-full flex-col bg-white font-sans text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100`}
      >
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16">{children}</main>
        <footer className="border-t border-neutral-200 py-8 dark:border-neutral-800">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-neutral-500 dark:text-neutral-400">
            <p className="font-display text-base font-semibold text-neutral-700 dark:text-neutral-200">
              Debait Club
            </p>
            <p className="italic">You should be open to changing your mind. We expect that.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
