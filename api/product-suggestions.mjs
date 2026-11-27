/**
 * Server-side OpenAI endpoint for a Vercel deployment.
 * Set OPENAI_API_KEY in the hosting provider's environment settings.
 */
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const product = request.body?.product;
  if (!product || typeof product.name !== 'string' || typeof product.category !== 'string') {
    response.status(400).json({ error: 'A valid product is required' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    response.status(503).json({ error: 'AI suggestions are not configured yet' });
    return;
  }

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        instructions: 'You write practical, warm shopping suggestions. Do not invent ingredients, materials, safety claims, or product attributes. Give one concise idea in no more than 55 words. If the item is food, do not make food-safety or allergy claims.',
        input: `Suggest one concrete way to use this local-shop product. Product: ${product.name}. Category: ${product.category}. Shop description: ${product.why ?? 'Not provided'}.`,
      }),
    });

    if (!openAiResponse.ok) {
      throw new Error(`OpenAI returned ${openAiResponse.status}`);
    }

    const result = await openAiResponse.json();
    const suggestion = typeof result.output_text === 'string' ? result.output_text.trim() : '';
    if (!suggestion) throw new Error('OpenAI returned no text');

    response.status(200).json({ suggestion });
  } catch (error) {
    console.error('Unable to create product suggestion', error);
    response.status(502).json({ error: 'Unable to create a suggestion right now' });
  }
}
