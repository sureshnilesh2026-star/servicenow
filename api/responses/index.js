import { appendResponse, clearAllResponses, getAllResponses } from '../_responsesStore.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await getAllResponses();
      res.status(200).json(rows);
      return;
    }

    if (req.method === 'POST') {
      const row = req.body;
      if (!row || typeof row !== 'object') {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }
      await appendResponse(row);
      res.status(201).json({ ok: true });
      return;
    }

    if (req.method === 'DELETE') {
      await clearAllResponses();
      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader('Allow', 'GET,POST,DELETE');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({
      error: 'Responses API failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

