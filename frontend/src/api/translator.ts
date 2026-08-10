// In-memory translation cache to avoid duplicate API calls
const translationCache = new Map<string, string>();

// List of public LibreTranslate mirror endpoints for redundancy
const LIBRETRANSLATE_ENDPOINTS = [
  'https://libretranslate.com/translate',
  'https://translate.terraprint.co/translate',
  'https://libretranslate.de/translate',
];

/**
 * Translates English text to Tamil using LibreTranslate with in-memory caching.
 * If API fails or times out, returns original text.
 */
export async function translateToTamil(text: string): Promise<string> {
  if (!text || text.trim() === '') return text;

  // Check in-memory cache first
  if (translationCache.has(text)) {
    return translationCache.get(text)!;
  }

  for (const endpoint of LIBRETRANSLATE_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: 'ta',
          format: 'text',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.translatedText) {
          const result = data.translatedText;
          translationCache.set(text, result);
          return result;
        }
      }
    } catch {
      // Try next endpoint if current one fails or times out
    }
  }

  // Fallback: Cache original text if translation endpoints are offline
  translationCache.set(text, text);
  return text;
}
