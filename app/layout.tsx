import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bcei.vercel.app'),
  applicationName: 'Any School Fee Discount',
  title: 'Any School Fee Discount',
  description: 'Get notified about the latest school fee discount updates',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Any School Fee Discount',
    description: 'Get notified about the latest school fee discount updates',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Any School Fee Discount',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Any School Fee Discount',
    description: 'Get notified about the latest school fee discount updates',
    images: ['/logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
