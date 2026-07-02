import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';
import { transcribeAudio } from '../skills/transcription.js';
import { runPipeline } from '../pipeline/run.js';
import familyRouter from './familyRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));
app.use('/api/family', familyRouter);

app.post('/api/process', upload.single('audio'), async (req, res) => {
  try {
    let text;

    if (req.file) {
      text = await transcribeAudio(req.file.buffer);
    } else if (req.body.text) {
      text = req.body.text;
    } else {
      return res.status(400).json({ error: 'Request must include a "text" field or an audio file.' });
    }

    const lang   = req.body.lang || 'en';
    const result = await runPipeline(text, lang);
    res.json({ result });
  } catch (err) {
    const status = err.message.startsWith('Input') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
