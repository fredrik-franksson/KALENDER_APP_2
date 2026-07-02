import 'dotenv/config';
import { runPipeline } from '../src/pipeline/run.js';

const sample =
  "Okay so um, I really need to call the dentist about my " +
  "appointment, that's important. Also I was thinking maybe " +
  "I should, you know, finish that report for work, it's " +
  "due friday so kind of urgent. Oh and grab groceries on " +
  "the way home, just milk and eggs really. Also need to " +
  "send the invoice to the client, that one's important too.";

const result = await runPipeline(sample);
console.log(result);
