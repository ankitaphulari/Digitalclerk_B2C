import { useCallback, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCachedTranslation, setCachedTranslation } from '@/utils/translationCache';

export interface AutoTranslateResult {
  translatedText: string;
  detectedSourceLanguage: string | null;
  confidence: number;
}

export const useAutoTranslate = (targetLang: string) => {
  const [result, setResult] = useState<AutoTranslateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const translate = useCallback(async (text: string, source?: string | null) => {
    setError(null);
    if (!text || text.trim().length === 0) {
      setResult(null);
      return null;
    }

    const cached = getCachedTranslation(text, targetLang, source);
    if (cached) {
      setResult({
        translatedText: cached.translatedText,
        detectedSourceLanguage: cached.detectedSourceLanguage,
        confidence: cached.confidence,
      });
      return cached;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { text, target: targetLang, source },
      });
      if (error) throw error;
      const payload = data as AutoTranslateResult;
      setResult(payload);
      setCachedTranslation(text, targetLang, payload, source);
      return payload;
    } catch (e: any) {
      setError(e?.message || 'Translation failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [targetLang]);

  const debouncedTranslate = useCallback((text: string, delay = 300, source?: string | null) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      translate(text, source);
    }, delay);
  }, [translate]);

  const clear = useCallback(() => setResult(null), []);

  return useMemo(() => ({ result, loading, error, translate, debouncedTranslate, clear }), [result, loading, error, translate, debouncedTranslate, clear]);
};
