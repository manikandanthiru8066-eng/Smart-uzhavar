import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateToTamil } from '../api/translator';

/**
 * Custom hook to get translated text.
 * Uses pre-stored Tamil translation (`taField`) if present.
 * If language is Tamil and `taField` is missing, triggers on-the-fly LibreTranslate translation with caching.
 */
export function useAutoTranslate(text: string | undefined, taField?: string | undefined): string {
  const { i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const [translated, setTranslated] = useState<string>(() => {
    if (!text) return '';
    if (!isTa) return text;
    if (taField && taField.trim() !== '') return taField;
    return text;
  });

  useEffect(() => {
    if (!text) {
      setTranslated('');
      return;
    }

    if (!isTa) {
      setTranslated(text);
      return;
    }

    // Pre-stored Tamil translation
    if (taField && taField.trim() !== '') {
      setTranslated(taField);
      return;
    }

    // Fallback: On-the-fly LibreTranslate translation
    let isMounted = true;
    translateToTamil(text).then((res) => {
      if (isMounted) {
        setTranslated(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [text, taField, isTa]);

  return translated;
}
