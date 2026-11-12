import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { Toaster } from '@/components/ui/sonner'
import { fontDisplay, fontSans } from '@/lib/fonts'
import { PressedProvider } from '@/components/pressed-provider'
import { RouteProgress } from '@/components/route-progress'
import { ScrollToTop } from '@/components/scroll-to-top'
import { Suspense } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'dev.akarun', template: '%s | dev.akarun' },
  description: 'A personal site and blog by dev.akarun.',
  openGraph: { siteName: 'dev.akarun' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon-192.png',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontDisplay.variable} ${fontSans.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          <ScrollToTop />
          <PressedProvider />
          <div className="flex min-h-screen w-full flex-col">
            <div className="sticky top-3 z-40 mt-4 w-full">
              <SiteHeader />
            </div>
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
            <div className="mx-auto w-full max-w-6xl px-4">
              <SiteFooter />
            </div>
          </div>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
