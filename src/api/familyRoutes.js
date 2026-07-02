import express from 'express';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router   = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE  = path.join(__dirname, '../../data/family.json');
const LEGACY_CODE = process.env.FAMILY_CODE || 'family2026';

// Unambiguous alphanumeric chars for codes
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode() {
  return Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function readData() {
  try {
    const raw    = await readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    // Migrate old single-group format { events: [] } → { groups: { [code]: { name, events } } }
    if (parsed.events && !parsed.groups) {
      return { groups: { [LEGACY_CODE]: { name: 'Family', events: parsed.events } } };
    }
    return parsed;
  } catch {
    return { groups: {} };
  }
}

async function writeData(data) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getGroup(req, res, data) {
  const code  = (req.headers['x-family-code'] || '').toUpperCase();
  const group = data.groups[code];
  if (!group) { res.status(401).json({ error: 'Invalid group code.' }); return null; }
  return group;
}

// Create a new group
router.post('/create', async (req, res) => {
  const { groupName, name } = req.body;
  if (!groupName?.trim() || !name?.trim()) {
    return res.status(400).json({ error: 'Group name and your name are required.' });
  }
  try {
    const data = await readData();
    let code;
    do { code = genCode(); } while (data.groups[code]);
    data.groups[code] = { name: groupName.trim(), events: [] };
    await writeData(data);
    res.json({ ok: true, code, groupName: groupName.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify code + name
router.post('/join', async (req, res) => {
  const { code, name } = req.body;
  if (!code || !name?.trim()) {
    return res.status(400).json({ error: 'Group code and name are required.' });
  }
  try {
    const data  = await readData();
    const group = data.groups[code.toUpperCase()];
    if (!group) return res.status(401).json({ error: 'Wrong group code.' });
    res.json({ ok: true, groupName: group.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get events
router.get('/events', async (req, res) => {
  try {
    const data  = await readData();
    const group = getGroup(req, res, data);
    if (!group) return;
    res.json({ events: group.events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add event
router.post('/events', async (req, res) => {
  try {
    const { title, date, notes, createdBy } = req.body;
    if (!title?.trim() || !createdBy?.trim()) {
      return res.status(400).json({ error: 'Title and name are required.' });
    }
    const data  = await readData();
    const group = getGroup(req, res, data);
    if (!group) return;

    const event = {
      id:        genId(),
      title:     title.trim(),
      date:      date || null,
      notes:     notes?.trim() || '',
      createdBy: createdBy.trim(),
      createdAt: new Date().toISOString(),
      reactions: {},
    };
    group.events.push(event);
    group.events.sort((a, b) => {
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

// React to event
router.post('/events/:id/react', async (req, res) => {
  try {
    const { name, reaction } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required.' });
    const data  = await readData();
    const group = getGroup(req, res, data);
    if (!group) return;

    const event = group.events.find(e => e.id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    if (!reaction) { delete event.reactions[name.trim()]; }
    else           { event.reactions[name.trim()] = reaction; }
    await writeData(data);
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const data  = await readData();
    const group = getGroup(req, res, data);
    if (!group) return;

    const idx = group.events.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Event not found.' });
    group.events.splice(idx, 1);
    await writeData(data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
