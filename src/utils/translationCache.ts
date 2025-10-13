export type TranslationCacheEntry = {
  translatedText: string;
  detectedSourceLanguage: string | null;
  confidence: number;
  timestamp: number;
};

const NAMESPACE = 'fm_translate_cache_v1';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const getKey = (text: string, target: string, source?: string | null) => {
  const base = `${target}::${source || 'auto'}::${text}`;
  // Simple hash to avoid huge keys
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash << 5) - hash + base.charCodeAt(i);
    hash |= 0;
  }
  return `${NAMESPACE}:${hash}`;
};

export const getCachedTranslation = (
  text: string,
  target: string,
  source?: string | null,
): TranslationCacheEntry | null => {
  try {
    const key = getKey(text, target, source);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as TranslationCacheEntry;
    if (Date.now() - entry.timestamp > DEFAULT_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
};

export const setCachedTranslation = (
  text: string,
  target: string,
  data: Omit<TranslationCacheEntry, 'timestamp'>,
  source?: string | null,
) => {
  try {
    const key = getKey(text, target, source);
    const entry: TranslationCacheEntry = { ...data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
};
