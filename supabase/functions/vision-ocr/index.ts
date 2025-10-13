// Remove the problematic import - it's not needed for this code
// import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  try {
    const globalTyped = globalThis as unknown as {
      Deno?: { env?: { get: (key: string) => string | undefined } };
      process?: { env?: Record<string, string | undefined> };
    };
    
    const apiKey = globalTyped.Deno?.env?.get("GOOGLE_VISION_API_KEY") ?? globalTyped.process?.env?.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing GOOGLE_VISION_API_KEY secret" }), {
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const payload = {
      requests: [
        {
          image: { content: imageBase64.replace(/^data:image\/\w+;base64,/, '') },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }]
        }
      ]
    };
    
    const response = await fetch(`${VISION_ENDPOINT}?key=${apiKey}`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const txt = await response.text();
      console.error("Vision API Error:", response.status, txt);
      return new Response(JSON.stringify({ error: "Vision API request failed", details: txt }), {
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const result = await response.json();
    const annotation = result?.responses?.[0];
    const fullText = annotation?.fullTextAnnotation?.text || annotation?.textAnnotations?.[0]?.description || "";
    
    return new Response(JSON.stringify({ text: fullText, raw: annotation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("vision-ocr error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(err) }), {
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});