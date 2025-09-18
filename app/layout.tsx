import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tool tạo mã vận đơn',
  icons: {
    icon: './logo/tinder.ico',
  },
  description: 'Tool tạo mã vận đơn hàng loạt miễn phí',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
