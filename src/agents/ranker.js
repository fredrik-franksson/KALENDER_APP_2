import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function rankItems(items) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system:
      'You receive a JSON array of grouped items. Within each group, order items from most important/urgent to least important. Add an \'order\' field (number, starting at 1) to each item representing its position within its group. Return ONLY a valid JSON array with all original fields plus order. No markdown, no explanation.',
    messages: [{ role: 'user', content: JSON.stringify(items) }],
  });

  const text  = response.content[0].text;
  const start = text.indexOf('[');
  const end   = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('Ranker: no JSON array in response');

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error('Ranker: invalid JSON response from Claude');
  }
}
