import { deleteResponseById } from '../_responsesStore.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'DELETE') {
      res.setHeader('Allow', 'DELETE');
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const id = req.query.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Missing id' });
      return;
    }

    const deleted = await deleteResponseById(id);
    res.status(200).json({ ok: true, deleted });
  } catch (error) {
    res.status(500).json({
      error: 'Delete response failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

