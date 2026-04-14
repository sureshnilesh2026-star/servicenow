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

/** Normalize common plural/singular variants so "Other Software" ≈ "Other Softwares". */
function labelCanonicalForCompare(text) {
  return normalizeLabel(text).replace(/\bsoftwares\b/g, 'software');
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const cur = [i];
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

function labelsAreSimilar(a, b) {
  const na = normalizeLabel(a);
  const nb = normalizeLabel(b);
  if (na === nb) return true;
  const ca = labelCanonicalForCompare(a);
  const cb = labelCanonicalForCompare(b);
  if (ca === cb) return true;

  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length > nb.length ? na : nb;
  if (shorter.length >= 4 && longer.startsWith(shorter) && longer.length - shorter.length <= 3) {
    return true;
  }

  const maxLen = Math.max(na.length, nb.length);
  if (!maxLen) return true;
  if (maxLen <= 48) {
    return levenshtein(na, nb) <= 2;
  }
  return levenshtein(na, nb) / maxLen <= 0.06;
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
  const optionKeys = new Set();
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

  function parentKey(p) {
    return p === undefined || p === null ? 'root' : p;
  }

  function hasSimilarSibling(label, parent, depth) {
    const pk = parentKey(parent);
    for (const row of optionRows) {
      if (row.depth !== depth) continue;
      if (parentKey(row.parent) !== pk) continue;
      if (labelsAreSimilar(row.label, label)) return true;
    }
    return false;
  }

  function addOption({ id, label, parent, depth }) {
    if (optionById.has(id)) return false;
    if (hasSimilarSibling(label, parent, depth)) return false;

    const normalizedLabel = normalizeLabel(label);
    const levelKey = `${depth}|${parentKey(parent)}|${normalizedLabel}`;
    if (optionKeys.has(levelKey)) return false;

    const node = { id, label, parent, depth };
    optionById.set(id, node);
    optionKeys.add(levelKey);
    optionRows.push(node);
    return true;
  }

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
      addOption({ id, label: currentLevel1, parent: undefined, depth: 1 });
      continue;
    }

    if (inLevel2 && currentLevel1) {
      const id = slugify(`${currentLevel1}-${bullet}`);
      addOption({ id, label: bullet, parent: slugify(currentLevel1), depth: 2 });
      continue;
    }

    if (inLevel3) {
      const asLevel2 = optionRows.find(
        r => r.depth === 2 && labelsAreSimilar(r.label, bullet),
      );
      if (asLevel2) {
        currentLevel1 = knownLevel1.find(v => slugify(v) === asLevel2.parent) || currentLevel1;
        currentLevel2 = asLevel2.label;
        continue;
      }

      if (currentLevel1 && currentLevel2) {
        const level2Id = slugify(`${currentLevel1}-${currentLevel2}`);
        const id = slugify(`${currentLevel1}-${currentLevel2}-${bullet}`);
        addOption({ id, label: bullet, parent: level2Id, depth: 3 });
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
      addOption({ id, label, parent, depth });
      parentId = id;
    });
  });

  return { options: optionRows };
}

