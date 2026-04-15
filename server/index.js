import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { readScenariosFromXlsx } from './data-loaders.js';
import { getManualLevelsPayload } from './manual-levels.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
const responsesFile = path.join(dataDir, 'responses.json');
const scenariosFile = path.join(dataDir, 'detabase.xlsx');

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(responsesFile)) fs.writeFileSync(responsesFile, '[]', 'utf8');
}

function readAll() {
  ensureStore();
  const raw = fs.readFileSync(responsesFile, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows) {
  ensureStore();
  fs.writeFileSync(responsesFile, JSON.stringify(rows, null, 2), 'utf8');
}


app.get('/api/responses', (_req, res) => {
  res.json(readAll());
});

app.get('/api/scenarios', (_req, res) => {
  res.json(readScenariosFromXlsx(scenariosFile));
});

app.get('/api/levels', async (_req, res) => {
  res.json(getManualLevelsPayload());
});

app.post('/api/responses', (req, res) => {
  const row = req.body;
  if (!row || typeof row !== 'object') {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const rows = readAll();
  rows.push(row);
  writeAll(rows);
  res.status(201).json({ ok: true });
});

app.delete('/api/responses', (_req, res) => {
  writeAll([]);
  res.json({ ok: true });
});

app.delete('/api/responses/:id', (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: 'Missing id' });
    return;
  }
  const rows = readAll();
  const next = rows.filter(r => r && typeof r === 'object' && r.id !== id);
  writeAll(next);
  res.json({ ok: true, deleted: rows.length - next.length });
});

const port = Number(process.env.PORT || 5176);
const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Writing to ${responsesFile}`);
});

server.on('error', err => {
  // eslint-disable-next-line no-console
  console.error('API server error', err);
  process.exit(1);
});

// Some environments unref the server handle; force it to keep the process alive.
if (typeof server.ref === 'function') server.ref();

