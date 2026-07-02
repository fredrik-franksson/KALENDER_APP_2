import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function filterAndExtract(text, lang = 'en') {
  const isSv  = lang === 'sv';
  const today = new Date().toLocaleDateString(isSv ? 'sv-SE' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const langInstruction = isSv
    ? 'Respond in Swedish. Write all titles and notes in Swedish. Format dates as "onsdag 1 juli" (full Swedish weekday name, day number, full Swedish month name in lowercase).'
    : 'Respond in English. Format dates as "Wednesday 1 July" (full weekday name, day number, full month name).';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system:
      `Today is ${today}. ${langInstruction} You read a stream-of-consciousness brain dump. Extract ONLY the important, actionable, or meaningful pieces of information. Ignore filler words, rambling, repeated phrases, and irrelevant tangents. For each item, extract any day or time reference and convert it to a full date using the format above. If a specific clock time was mentioned (e.g. "3pm", "10:30", "noon"), append it: e.g. "Wednesday 1 July at 3pm" or "onsdag 1 juli kl 15:00". Do not append vague time-of-day words like "morning"/"morgon" or "evening"/"kväll" unless an actual time was given. If no date is mentioned set when to null. Also detect whether the user marked it as urgent (words like "urgent", "asap", "immediately", "critical", "brådskande", "akut", "viktig", "high priority"). Return ONLY a valid JSON array of objects with fields: title (string), notes (string — any items to bring, things to prepare, or details to remember; empty string if none), when (string or null), urgent (boolean). No markdown, no explanation.`,
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
