import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Real-Time Orderbook Viewer',
  description: 'Real-time orderbook viewer with order simulation capabilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bg-dark text-white min-h-screen`}>
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-2">
              Real-Time Orderbook Viewer
            </h1>
            <p className="text-gray-400 text-center">
              Multi-venue orderbook display with order simulation
            </p>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
