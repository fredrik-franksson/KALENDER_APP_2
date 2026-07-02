export function validateInput(text) {
  if (!text || text.length === 0) throw new Error('Input is empty');
  if (text.trim().length < 3) throw new Error('Input too short');
  return text;
}
