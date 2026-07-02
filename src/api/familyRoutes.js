import express from 'express';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE  = path.join(__dirname, '../../data/family.json');
const FAMILY_CODE = process.env.FAMILY_CODE || 'family2026';

async function readData() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { events: [] };
  }
}

async function writeData(data) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function auth(req, res, next) {
  const code = req.headers['x-family-code'];
  if (code !== FAMILY_CODE) return res.status(401).json({ error: 'Invalid family code.' });
  next();
}

// Verify code + name
router.post('/join', (req, res) => {
  const { code, name } = req.body;
  if (!code || !name?.trim()) {
    return res.status(400).json({ error: 'Family code and name are required.' });
  }
  if (code !== FAMILY_CODE) {
    return res.status(401).json({ error: 'Wrong family code.' });
  }
  res.json({ ok: true, name: name.trim() });
});

// Get all events
router.get('/events', auth, async (req, res) => {
  try {
    const data = await readData();
    res.json({ events: data.events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add event
router.post('/events', auth, async (req, res) => {
  try {
    const { title, date, notes, createdBy } = req.body;
    if (!title?.trim() || !createdBy?.trim()) {
      return res.status(400).json({ error: 'Title and name are required.' });
    }
    const data = await readData();
    const event = {
      id:        genId(),
      title:     title.trim(),
      date:      date || null,
      notes:     notes?.trim() || '',
      createdBy: createdBy.trim(),
      createdAt: new Date().toISOString(),
      reactions: {},
    };
    data.events.push(event);
    data.events.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
    await writeData(data);
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// React to event: reaction = 'up' | 'down' | null (to remove)
router.post('/events/:id/react', auth, async (req, res) => {
  try {
    const { name, reaction } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required.' });
    const data  = await readData();
    const event = data.events.find(e => e.id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    if (!reaction) {
      delete event.reactions[name.trim()];
    } else {
      event.reactions[name.trim()] = reaction;
    }
    await writeData(data);
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete event
router.delete('/events/:id', auth, async (req, res) => {
  try {
    const data = await readData();
    const idx  = data.events.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Event not found.' });
    data.events.splice(idx, 1);
    await writeData(data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
