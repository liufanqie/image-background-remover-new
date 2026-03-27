import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Image Background Remover',
  description: '一键移除图片背景，免费、快速、隐私安全',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
