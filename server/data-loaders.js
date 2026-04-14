import fs from 'node:fs';
import xlsx from 'xlsx';
import mammoth from 'mammoth';

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

export function readScenariosFromXlsx(scenariosFile) {
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

export async function parseLevelsFromDocx(levelsFile, scenarios = []) {
  if (!fs.existsSync(levelsFile)) return { options: [] };

  let text = '';
  try {
    const result = await mammoth.extractRawText({ path: levelsFile });
    text = result.value || '';
  } catch {
    text = '';
  }

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

    const bulletMatch = line.match(/^[•\-]\s*(.+)$/);
    if (!bulletMatch) continue;
    const bullet = bulletMatch[1].trim();
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
      const id = slugify(`${currentLevel1}-${bullet}`);
      if (!optionById.has(id)) {
        const node = { id, label: bullet, parent: slugify(currentLevel1), depth: 2 };
        optionById.set(id, node);
        optionRows.push(node);
      }
      continue;
    }

    if (inLevel3) {
      const asLevel2 = optionRows.find(
        r => r.depth === 2 && normalizeLabel(r.label) === normalized,
      );
      if (asLevel2) {
        currentLevel1 = knownLevel1.find(v => slugify(v) === asLevel2.parent) || currentLevel1;
        currentLevel2 = asLevel2.label;
        continue;
      }

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

