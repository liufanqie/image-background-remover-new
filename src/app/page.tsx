'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

interface Result {
  originalImage: string
  resultImage: string
  remaining: number
}

export default function Home() {
  const [state, setState] = useState<ProcessingState>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      setState('error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB allowed.')
      setState('error')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Process image
    setState('processing')
    setError(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to process image')
        setState('error')
        return
      }

      setResult({
        originalImage: URL.createObjectURL(file),
        resultImage: data.imageUrl,
        remaining: data.remaining,
      })
      setState('done')
    } catch (err) {
      setError('Network error. Please try again.')
      setState('error')
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDownload = () => {
    if (!result) return

    const link = document.createElement('a')
    link.href = result.resultImage
    link.download = 'removed-background.png'
    link.click()
  }

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setError(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BG</span>
            </div>
            <span className="font-semibold text-gray-900">Image Remover</span>
          </div>
          <button className="text-sm text-gray-600 hover:text-gray-900">
            登录 / 注册
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            一键移除图片背景
          </h1>
          <p className="text-lg text-gray-600">
            免费、快速、隐私安全 · 3秒内获得透明背景图片
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          {state === 'idle' || state === 'error' ? (
            <div
              className={`dropzone ${isDragging ? 'active' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    拖拽图片到这里，或点击上传
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    支持 JPG / PNG / WebP，最大 10MB
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
              {error}
              <button
                onClick={handleReset}
                className="ml-4 underline hover:no-underline"
              >
                重试
              </button>
            </div>
          )}

          {/* Preview */}
          {previewUrl && state === 'processing' && (
            <div className="mt-8 flex justify-center">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg
                    className="animate-spin w-16 h-16 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600">正在移除背景...</p>
                <p className="text-sm text-gray-400 mt-1">预计 3-5 秒</p>
              </div>
            </div>
          )}

          {/* Result */}
          {state === 'done' && result && (
            <div className="mt-8">
              {/* Comparison */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-lg p-4">
                  <p className="text-sm text-gray-500 mb-3 text-center">原图</p>
                  <div className="relative aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y5ZjlmYSIvPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==')] bg-repeat rounded-lg overflow-hidden">
                    <img
                      src={result.originalImage}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-4">
                  <p className="text-sm text-gray-500 mb-3 text-center">结果图</p>
                  <div className="relative aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y5ZjlmYSIvPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==')] bg-repeat rounded-lg overflow-hidden">
                    <img
                      src={result.resultImage}
                      alt="Result"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={handleDownload}
                  className="btn-primary w-full sm:w-auto"
                >
                  下载透明背景图
                </button>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  处理下一张
                </button>
              </div>

              {/* Remaining */}
              <p className="text-center text-sm text-gray-500 mt-6">
                今日剩余次数：{result.remaining} / 5
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">快速</h3>
            <p className="text-sm text-gray-600">3秒内完成背景移除</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">隐私安全</h3>
            <p className="text-sm text-gray-600">图片不存储，处理完即删</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">免费使用</h3>
            <p className="text-sm text-gray-600">每天5次免费额度</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
          <p>© 2026 Image Remover. 图片仅用于背景移除服务。</p>
        </div>
      </footer>
    </div>
  )
}
