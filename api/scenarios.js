import path from 'node:path';
import { readScenariosFromXlsx } from '../server/data-loaders.js';

export default function handler(_req, res) {
  const scenariosFile = path.join(process.cwd(), 'data', 'detabase.xlsx');
  const scenarios = readScenariosFromXlsx(scenariosFile);
  res.status(200).json(scenarios);
}

