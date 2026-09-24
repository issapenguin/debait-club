import type { Metadata } from 'next';
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
  title: 'Debait Club — Change your mind daily',
  description:
    'A daily debate club. One topic per category, every day. Make your case, hear the other side, and stay open to changing your mind.',
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem('debait-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
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
