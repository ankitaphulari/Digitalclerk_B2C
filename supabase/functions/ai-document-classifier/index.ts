import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt, imageBase64, model = 'gpt-4.1-2025-04-14' } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: 'You are an expert document classifier. You can identify any type of document with high accuracy based on content, layout, and context. Always return valid JSON responses.'
      },
      {
        role: 'user',
        content: imageBase64 ? [
          { type: 'text', text: prompt },
          { 
            type: 'image_url', 
            image_url: { 
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: 'high'
            }
          }
        ] : prompt
      }
    ];

    console.log('Calling OpenAI API for document classification...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_completion_tokens: 1500,
        ...(model.includes('gpt-4o') && { temperature: 0.2 })
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const result = data.choices[0].message.content;
    
    console.log('Document classification completed successfully');

    return new Response(JSON.stringify({ 
      result,
      usage: data.usage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-document-classifier function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Document classification failed. Please try again or use fallback classification.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});