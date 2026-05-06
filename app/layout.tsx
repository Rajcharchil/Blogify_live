import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { AuthProvider } from './contexts/AuthContext'
import './globals.css'

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BLOGIFY - Share Your Stories, Watch Live',
  description: 'A modern platform for creators and readers. Write blogs, stream live, and build your community with AI-powered features.',
  icons: {
    icon: '/icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased bg-slate-900`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
