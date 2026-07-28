import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Luxe Tracker — Global Launch & Price Disparity',
  description:
    'High-fashion global launch and price disparity tracker. 5 brands · 25 products · 11k+ price history rows · 17 intelligence panels.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

// Inline script that runs BEFORE React hydrates, applies the saved theme
// to <html data-theme="..."> so there's no flash on first paint.
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('luxe-tracker:theme');
    if (t !== 'dark' && t !== 'light') {
      t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
`.trim()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] antialiased"
        style={{
          fontFamily: 'var(--font-sans)',
          fontFeatureSettings: '"ss01", "cv11"',
        }}
      >
        {children}
      </body>
    </html>
  )
}
