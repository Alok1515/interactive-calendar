import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Interactive Wall Calendar',
  description: 'A beautifully crafted interactive wall calendar component with event management, inspired by physical wall calendars.',
  keywords: ['calendar', 'interactive', 'events', 'wall calendar', 'React', 'Next.js'],
  openGraph: {
    title: 'Interactive Wall Calendar',
    description: 'A polished, animated wall calendar component with event management',
    type: 'website',
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
