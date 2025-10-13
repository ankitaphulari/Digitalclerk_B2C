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

    const { prompt, model = 'gpt-4.1-2025-04-14' } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('Calling OpenAI API for field mapping...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at mapping document fields to form fields. You understand semantic relationships between different field names and can suggest intelligent mappings. Always return valid JSON responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 1500,
        temperature: 0.1, // Very low temperature for consistent mapping logic
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
    
    console.log('Field mapping completed successfully');

    return new Response(JSON.stringify({ 
      result,
      usage: data.usage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-field-mapper function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Field mapping failed. Please try again or use manual mapping.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});