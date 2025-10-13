import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_CLOUD_TRANSLATE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_CLOUD_TRANSLATE_API_KEY is not set');
    }

    const { text, target, source } = await req.json();

    if (!text || !target) {
      throw new Error('Both text and target are required');
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const body: Record<string, string> = {
      q: text,
      target,
      format: 'text',
    };
    if (source) body.source = source;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Google Translate error:', err);
      throw new Error('Translation API error');
    }

    const data = await response.json();
    const tr = data?.data?.translations?.[0];

    const result = {
      translatedText: tr?.translatedText ?? text,
      detectedSourceLanguage: tr?.detectedSourceLanguage ?? source ?? null,
      confidence: tr?.model ? 0.9 : 0.75, // heuristic when API doesn't return confidence
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in translate function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
