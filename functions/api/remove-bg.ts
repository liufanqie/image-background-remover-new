interface CloudflareEnv {
  REMOVE_BG_API_KEY?: string;
}

export async function onRequestPost(context: { request: Request; env: CloudflareEnv }): Promise<Response> {
  const { request, env } = context

  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return new Response(JSON.stringify({ success: false, error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ success: false, error: 'File too large. Max 10MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(imageFile.type)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid file type.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const buffer = await imageFile.arrayBuffer()
    const apiKey = env.REMOVE_BG_API_KEY || 'AKeknsaEss1BXwvi3ztBC23a'

    const removeBgFormData = new FormData()
    removeBgFormData.append('image_file', new Blob([buffer], { type: imageFile.type }), imageFile.name)
    removeBgFormData.append('size', 'auto')
    removeBgFormData.append('format', 'png')

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: removeBgFormData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Remove.bg API error:', error)
      return new Response(JSON.stringify({ success: false, error: 'Failed to remove background' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const resultBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(resultBuffer).toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    return new Response(JSON.stringify({
      success: true,
      imageUrl: dataUrl,
      remaining: 5,
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
