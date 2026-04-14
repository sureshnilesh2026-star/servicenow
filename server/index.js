import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import xlsx from 'xlsx';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
const responsesFile = path.join(dataDir, 'responses.json');
const scenariosFile = path.join(dataDir, 'detabase.xlsx');
const levelsFile = path.join(dataDir, 'level.docx');

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeLabel(text) {
  return String(text || '')
    .replace(/[&]/g, 'and')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

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

function parseScenarioText(rawText, expectedPath, index) {
  const text = String(rawText || '').trim();
  if (!text) return null;

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const scenarioLine = lines.find(line => /^scenario\s*:/i.test(line)) || '';
  const userLine = lines.find(line => /^user\s*:/i.test(line)) || '';
  const issueLine = lines.find(line => /^issue\s*:/i.test(line)) || '';
  const questionLine = lines.find(
    line => /where should .*navigate to raise a ticket\??/i.test(line),
  );

  const title = scenarioLine.replace(/^scenario\s*:\s*/i, '').trim() || `Scenario ${index + 1}`;

  return {
    id: `scenario-${index + 1}`,
    title,
    user: userLine.replace(/^user\s*:\s*/i, '').trim(),
    issue: issueLine.replace(/^issue\s*:\s*/i, '').trim(),
    question: questionLine || 'Where should the user navigate to raise a ticket?',
    expectedPath: String(expectedPath || '').trim(),
    rawText: text,
  };
}

function readScenarios() {
  if (!fs.existsSync(scenariosFile)) return [];
  const workbook = xlsx.readFile(scenariosFile);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

  const scenarios = [];
  rows.forEach((row, rowIndex) => {
    const firstCell = Array.isArray(row) ? row[0] : '';
    const secondCell = Array.isArray(row) ? row[1] : '';
    const parsed = parseScenarioText(firstCell, secondCell, rowIndex);
    if (parsed) scenarios.push(parsed);
  });

  return scenarios;
}

function readDocxText(docxPath) {
  if (!fs.existsSync(docxPath)) return '';
  try {
    // macOS textutil is available on this environment and works with DOCX.
    return execSync(`textutil -convert txt -stdout "${docxPath}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return '';
  }
}

function parseLevelsFromDocx() {
  const text = readDocxText(levelsFile);
  if (!text.trim()) return { options: [] };

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const optionRows = [];
  const optionById = new Map();

  let inLevel2 = false;
  let inLevel3 = false;
  let currentLevel1 = '';
  let currentLevel2 = '';

  const knownLevel1 = [
    'Device & Hardware',
    'Software & Application',
    'Bank Infrastructure & Network',
  ];
  const knownLevel1Norm = new Map(knownLevel1.map(v => [normalizeLabel(v), v]));

  for (const line of lines) {
    if (/^Level\s*01/i.test(line)) {
      inLevel2 = false;
      inLevel3 = false;
      continue;
    }
    if (/^Level\s*02/i.test(line)) {
      inLevel2 = true;
      inLevel3 = false;
      currentLevel1 = '';
      currentLevel2 = '';
      continue;
    }
    if (/^Level\s*03/i.test(line)) {
      inLevel2 = false;
      inLevel3 = true;
      currentLevel1 = '';
      currentLevel2 = '';
      continue;
    }

    if (!line.startsWith('•')) continue;
    const bullet = line.replace(/^•\s*/, '').trim();
    if (!bullet) continue;

    const normalized = normalizeLabel(bullet);
    const matchedLevel1 = knownLevel1Norm.get(normalized);
    if (matchedLevel1) {
      currentLevel1 = matchedLevel1;
      currentLevel2 = '';
      const id = slugify(currentLevel1);
      if (!optionById.has(id)) {
        const node = { id, label: currentLevel1, parent: undefined, depth: 1 };
        optionById.set(id, node);
        optionRows.push(node);
      }
      continue;
    }

    if (inLevel2 && currentLevel1) {
      // Treat bullet as level 2 item under current level 1.
      const id = slugify(`${currentLevel1}-${bullet}`);
      if (!optionById.has(id)) {
        const node = { id, label: bullet, parent: slugify(currentLevel1), depth: 2 };
        optionById.set(id, node);
        optionRows.push(node);
      }
      continue;
    }

    if (inLevel3) {
      // In level 3 section, first match any known level2 label to set current parent.
      const asLevel2 = optionRows.find(r => r.depth === 2 && normalizeLabel(r.label) === normalized);
      if (asLevel2) {
        currentLevel1 = knownLevel1.find(v => slugify(v) === asLevel2.parent) || currentLevel1;
        currentLevel2 = asLevel2.label;
        continue;
      }

      // Add level 3 entries under last seen level2.
      if (currentLevel1 && currentLevel2) {
        const level2Id = slugify(`${currentLevel1}-${currentLevel2}`);
        const id = slugify(`${currentLevel1}-${currentLevel2}-${bullet}`);
        if (!optionById.has(id)) {
          const node = { id, label: bullet, parent: level2Id, depth: 3 };
          optionById.set(id, node);
          optionRows.push(node);
        }
      }
    }
  }

  // Add deeper levels (Level 4+) from expected paths in Excel answers.
  const scenarios = readScenarios();
  scenarios.forEach(scenario => {
    const parts = String(scenario.expectedPath || '')
      .split('->')
      .map(part => part.trim())
      .filter(Boolean);
    if (parts.length < 2) return;

    let parentId;
    parts.forEach((label, idx) => {
      const chain = parts.slice(0, idx + 1).join(' > ');
      const id = slugify(chain);
      const depth = idx + 1;
      const parent = parentId;
      if (!optionById.has(id)) {
        const node = { id, label, parent, depth };
        optionById.set(id, node);
        optionRows.push(node);
      }
      parentId = id;
    });
  });

  return { options: optionRows };
}

app.get('/api/responses', (_req, res) => {
  res.json(readAll());
});

app.get('/api/scenarios', (_req, res) => {
  res.json(readScenarios());
});

app.get('/api/levels', (_req, res) => {
  res.json(parseLevelsFromDocx());
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

