import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Hệ thống quản lý mã vận đơn",
  icons: {
    icon: "./logo/tinder.ico",
  },
  description: "Công cụ tạo và kiểm tra mã vận đơn tự động",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
