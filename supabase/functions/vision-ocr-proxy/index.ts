// Google Vision OCR Proxy - Only external dependency allowed
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      })
    }

    const { imageBase64 } = await req.json()
    
    if (!imageBase64) {
      return new Response('Missing imageBase64', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Get Google Vision API key from environment
    const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY')
    if (!apiKey) {
      return new Response('Google Vision API key not configured', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Call Google Vision API
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`
    
    const response = await fetch(visionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: imageBase64
          },
          features: [{
            type: 'DOCUMENT_TEXT_DETECTION'
          }]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`)
    }

    const result = await response.json()
    
    // Extract text from Vision API response
    const fullTextAnnotation = result.responses?.[0]?.fullTextAnnotation
    const text = fullTextAnnotation?.text || ''
    
    // Calculate confidence (Vision API doesn't provide overall confidence, so we estimate)
    const confidence = text.length > 10 ? 0.8 : 0.4

    return new Response(
      JSON.stringify({
        text,
        confidence,
        success: true
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Vision OCR error:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})