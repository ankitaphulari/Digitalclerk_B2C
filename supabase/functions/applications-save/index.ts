import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-expect-error: remote Deno std lib; type-checker may not resolve this URL in all environments
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
// @ts-expect-error: remote module; type-checker may not resolve @supabase/supabase-js in all environments
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function encodeBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}

function decodeBase64(s: string): Uint8Array {
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function encryptJSON(obj: unknown, secret: string): Promise<{ cipher: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: iv, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const plaintext = enc.encode(JSON.stringify(obj));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return { cipher: encodeBase64(new Uint8Array(ciphertext)), iv: encodeBase64(iv) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    function getEnv(key: string): string | undefined {
      interface DenoLike { env?: { get?(k: string): string | undefined } }
      const deno = (globalThis as unknown as { Deno?: DenoLike }).Deno;
      if (deno && deno.env && typeof deno.env.get === "function") {
        return deno.env.get(key);
      }
      if (typeof process !== "undefined") {
        const proc = process as unknown as { env?: Record<string, string | undefined> };
        if (proc.env) {
          return proc.env[key];
        }
      }
      return undefined;
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRole = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const encryptionSecret = getEnv("ENCRYPTION_SECRET");

    if (!supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ error: "Missing Supabase config" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { formType, formUrl, extractedData, files } = body || {};

    if (!encryptionSecret) {
      return new Response(JSON.stringify({ error: "ENCRYPTION_SECRET not set" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload = {
      user_id: user.id,
      form_type: String(formType || "unknown"),
      form_url: formUrl || null,
      status: "draft",
      confidence: typeof extractedData?.confidence === "number" ? extractedData.confidence : null,
      files: files || [],
    };

    const encrypted = await encryptJSON({ extractedData }, encryptionSecret);

    const { data, error } = await supabase.from("applications").insert({
      ...payload,
      extracted_data: { cipher: encrypted.cipher, iv: encrypted.iv },
    }).select("id").single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ id: data.id }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("applications-save error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});