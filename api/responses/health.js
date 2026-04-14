import { getAllResponses } from '../_responsesStore.js';

export default async function handler(_req, res) {
  try {
    const rows = await getAllResponses();
    res.status(200).json({ ok: true, count: rows.length });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

