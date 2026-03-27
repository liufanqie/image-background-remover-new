import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large. Max 10MB allowed.' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Use JPG, PNG, or WebP.' },
        { status: 400 }
      )
    }

    // Get file buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Call Remove.bg API
    const removeBgFormData = new FormData()
    removeBgFormData.append('image_file', new Blob([buffer], { type: imageFile.type }), imageFile.name)
    removeBgFormData.append('size', 'auto')
    removeBgFormData.append('format', 'png')

    const apiKey = process.env.REMOVE_BG_API_KEY

    if (!apiKey) {
      // Demo mode: return the original image with a mock response
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${imageFile.type};base64,${base64}`
      return NextResponse.json({
        success: true,
        imageUrl: dataUrl,
        remaining: 5,
        demo: true,
      })
    }

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: removeBgFormData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Remove.bg API error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to remove background' },
        { status: 500 }
      )
    }

    // Return the result image as base64
    const resultBuffer = await response.arrayBuffer()
    const resultBase64 = Buffer.from(resultBuffer).toString('base64')
    const resultDataUrl = `data:image/png;base64,${resultBase64}`

    return NextResponse.json({
      success: true,
      imageUrl: resultDataUrl,
      remaining: 5, // TODO: implement real quota tracking
    })
  } catch (error) {
    console.error('Error processing image:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
