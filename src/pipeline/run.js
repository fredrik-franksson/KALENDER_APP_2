import { validateInput } from '../hooks/inputValidator.js';
import { filterAndExtract } from '../agents/filterExtractor.js';
import { normaliseFormat } from '../hooks/formatNormaliser.js';
import { organiseItems } from '../agents/organiser.js';
import { rankItems } from '../agents/ranker.js';
import { formatOutput } from '../skills/outputFormatter.js';

export async function runPipeline(text, lang = 'en') {
  try {
    validateInput(text);
    const rawItems = await filterAndExtract(text, lang);
    const cleanItems = normaliseFormat(rawItems);
    const organised = await organiseItems(cleanItems);
    const ranked = await rankItems(organised);
    return formatOutput(ranked);
  } catch (err) {
    throw new Error(`Pipeline failed: ${err.message}`);
  }
}
