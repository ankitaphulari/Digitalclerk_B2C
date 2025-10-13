import { useCallback, useEffect, useState } from 'react';
import { useAutoTranslate } from './useAutoTranslate';
import { useLanguage } from '@/LanguageSupport';

interface RealtimeTranslationOptions {
  delay?: number;
  minLength?: number;
}

export const useRealtimeTranslation = (options: RealtimeTranslationOptions = {}) => {
  const { delay = 500, minLength = 3 } = options;
  const { language } = useLanguage();
  const { translate, result, loading, error } = useAutoTranslate(language);
  const [originalText, setOriginalText] = useState('');

  const translateText = useCallback((text: string, sourceLanguage?: string) => {
    if (!text || text.length < minLength || language === 'en') {
      setOriginalText(text);
      return;
    }

    setOriginalText(text);
    
    // Use debounced translation for real-time scenarios
    const timeoutId = setTimeout(() => {
      translate(text, sourceLanguage);
    }, delay);

    // Return cleanup function properly
    return timeoutId;
  }, [translate, delay, minLength, language]);

  const getDisplayText = useCallback(() => {
    // Always return original text for English or when no translation available
    if (language === 'en' || !result?.translatedText) {
      return originalText;
    }
    return result.translatedText;
  }, [language, result, originalText]);

  // Clear translation cache when language changes
  useEffect(() => {
    setOriginalText('');
  }, [language]);

  return {
    translateText,
    getDisplayText,
    isTranslating: loading,
    translationError: error,
    hasTranslation: !!result?.translatedText,
    detectedLanguage: result?.detectedSourceLanguage,
    confidence: result?.confidence
  };
};