import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bar Council Election Updates',
  description: 'Get notified about important Bar Council election updates',
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
