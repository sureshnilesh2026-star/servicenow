import path from 'node:path';
import { parseLevelsFromDocx, readScenariosFromXlsx } from '../server/data-loaders.js';

export default async function handler(_req, res) {
  const root = process.cwd();
  const scenariosFile = path.join(root, 'data', 'detabase.xlsx');
  const levelsFile = path.join(root, 'data', 'level.docx');

  const scenarios = readScenariosFromXlsx(scenariosFile);
  const levels = await parseLevelsFromDocx(levelsFile, scenarios);
  res.status(200).json(levels);
}

