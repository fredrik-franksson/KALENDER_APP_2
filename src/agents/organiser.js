import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function organiseItems(items) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system:
      'You receive a JSON array of items each with a "when" field. Assign each item to exactly one of these four groups: "Today", "This Week", "Next Week", "Upcoming". Use the "when" field to decide. "Upcoming" is for anything beyond next week or with no clear timeframe. Merge any items that mean the same thing, even if worded differently, combining their notes. Add a \'group\' field to each item. Return ONLY a valid JSON array with all original fields plus group. No markdown, no explanation.',
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
