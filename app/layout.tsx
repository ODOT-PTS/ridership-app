import { Inter } from 'next/font/google'

import 'maplibre-gl/dist/maplibre-gl.css'
import "@/styles/globals.css"

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'Ridership Visualization',
  description: 'Ridership App for GTFS-Ride data'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
