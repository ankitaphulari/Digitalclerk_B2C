// Remove the problematic Deno imports
// import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'
// import "https://deno.land/x/xhr@0.1.0/mod.ts"

export {}

type ServeFn = (handler: (req: Request) => Response | Promise<Response>) => void | Promise<void>;

const globalWithServe = globalThis as unknown as { 
  serve?: ServeFn; 
  Deno?: { serve?: ServeFn } 
};

// Prefer an existing global `serve`, then Deno.serve if available; otherwise throw at runtime with a clear message.
const serve: ServeFn = globalWithServe.serve ?? globalWithServe.Deno?.serve ?? (handler => {
  throw new Error("No `serve` function available in this runtime; provide a global `serve` or run in a Deno runtime with Deno.serve.");
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    // Safely access possible environments without using `any`
    type DenoEnv = { env?: { get?: (key: string) => string | undefined } }
    const deno = (globalThis as unknown as { Deno?: DenoEnv }).Deno
    const globalOpenAI = (globalThis as unknown as { OPENAI_API_KEY?: string }).OPENAI_API_KEY
    const openaiKey =
      deno?.env?.get?.('OPENAI_API_KEY') ??
      (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined) ??
      globalOpenAI

    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice || 'alloy',
        response_format: 'mp3',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate speech')
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    return new Response(
      JSON.stringify({ audioContent: base64Audio, format: 'mp3' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})