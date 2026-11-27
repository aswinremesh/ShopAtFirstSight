import type { Product } from './types';

export type SuggestionSource = 'ai' | 'demo';

export interface ProductSuggestion {
  source: SuggestionSource;
  text: string;
}

interface SuggestionResponse {
  suggestion?: unknown;
}

export function demoSuggestion(product: Product): string {
  const suggestions = {
    Food: `Try ${product.name} as the small twist in a simple dinner. Start with familiar ingredients, taste as you go, and use a little at a time so it stays the star of the dish.`,
    Home: `Give ${product.name} a job you will see every day: make it part of a breakfast corner, an entryway drop zone, or an open shelf with one plant and one favourite book.`,
    Gifts: `${product.name} works best as a thoughtful little extra. Pair it with a handwritten note about why it reminded you of them, then let the one-of-a-kind detail do the rest.`,
    DIY: `Set aside an unhurried 20 minutes for ${product.name}. Lay out the materials first, keep the first version simple, and treat it as a small experiment rather than a perfect project.`,
  } as const;

  return suggestions[product.category];
}

export async function getProductSuggestion(product: Product): Promise<ProductSuggestion> {
  try {
    const response = await fetch('/api/product-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
    });

    if (!response.ok) throw new Error('Suggestion service is unavailable');

    const payload = (await response.json()) as SuggestionResponse;
    if (typeof payload.suggestion !== 'string' || !payload.suggestion.trim()) {
      throw new Error('Suggestion service returned an empty response');
    }

    return { source: 'ai', text: payload.suggestion.trim() };
  } catch {
    return { source: 'demo', text: demoSuggestion(product) };
  }
}
