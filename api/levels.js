import { getManualLevelsPayload } from '../server/manual-levels.js';

export default async function handler(_req, res) {
  res.status(200).json(getManualLevelsPayload());
}

