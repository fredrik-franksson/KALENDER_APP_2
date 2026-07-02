import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function organiseItems(items) {
  const todayISO     = new Date().toISOString().slice(0, 10);
  const currentMonth = todayISO.slice(0, 7);
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system:
      `Today is ${todayISO}. Current month is ${currentMonth}. You receive a JSON array of items each with a "when" field (ISO date YYYY-MM-DD or YYYY-MM-DDTHH:MM, or null). Assign each item to a calendar month by adding a "group" field in "YYYY-MM" format derived from the item's "when" date. Items with null "when" go to the current month (${currentMonth}). Merge any items that mean the same thing, even if worded differently, combining their notes. Return ONLY a valid JSON array with all original fields plus group. No markdown, no explanation.`,
    messages: [{ role: 'user', content: JSON.stringify(items) }],
  });

  const text  = response.content[0].text;
  const start = text.indexOf('[');
  const end   = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('Organiser: no JSON array in response');

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error('Organiser: invalid JSON response from Claude');
  }
}
