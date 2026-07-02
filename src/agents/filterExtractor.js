import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function filterAndExtract(text, lang = 'en') {
  const isSv     = lang === 'sv';
  const todayISO = new Date().toISOString().slice(0, 10);

  const langInstruction = isSv
    ? 'Respond in Swedish. Write all titles and notes in Swedish.'
    : 'Respond in English. Write all titles and notes in English.';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system:
      `Today is ${todayISO}. ${langInstruction} You read a stream-of-consciousness brain dump. Extract ONLY the important, actionable, or meaningful pieces of information. Ignore filler words, rambling, repeated phrases, and irrelevant tangents. For each item, convert any date or time reference to ISO format in the "when" field: use YYYY-MM-DD for a date alone, or YYYY-MM-DDTHH:MM for a date with a specific clock time in 24-hour format. Do not store vague time-of-day words like "morning" or "evening" unless an actual clock time was given. If no date is mentioned, set when to null. Also detect urgency (words like "urgent", "asap", "immediately", "critical", "brådskande", "akut", "viktig", "high priority"). Return ONLY a valid JSON array of objects with fields: title (string), notes (string — any items to bring, things to prepare, or details to remember; empty string if none), when (ISO date string or null), urgent (boolean). No markdown, no explanation.`,
    messages: [{ role: 'user', content: text }],
  });

  const raw   = response.content[0].text;
  const start = raw.indexOf('[');
  const end   = raw.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('FilterExtractor: no JSON array in response');

  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new Error('FilterExtractor: invalid JSON response from Claude');
  }
}
