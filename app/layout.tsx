import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MetaEdge — Professional Bank Management',
  description: 'Manage your betting bankroll with professional data tracking and smart goal setting.',
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased selection:bg-accent-green/30 selection:text-white">
        {children}
      </body>
    </html>
  )
}
