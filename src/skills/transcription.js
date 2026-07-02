import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function transcribeAudio(audioBuffer) {
  const base64Audio = audioBuffer.toString('base64');

  let response;
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'audio/webm',
                data: base64Audio,
              },
            },
            {
              type: 'text',
              text: 'Transcribe exactly what was said in this audio. Return only the spoken words, no commentary, no explanations.',
            },
          ],
        },
      ],
    });
  } catch (err) {
    throw new Error(`Transcription failed: ${err.message}`);
  }

  const block = response.content.find((b) => b.type === 'text');
  if (!block || !block.text.trim()) {
    throw new Error('Transcription failed: no text returned from model');
  }
  return block.text.trim();
}
