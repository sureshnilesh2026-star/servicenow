import { kv } from '@vercel/kv';

const RESPONSES_KEY = 'clustering:responses';

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export async function getAllResponses() {
  const value = await kv.get(RESPONSES_KEY);
  return ensureArray(value);
}

export async function appendResponse(response) {
  const current = await getAllResponses();
  current.push(response);
  await kv.set(RESPONSES_KEY, current);
}

export async function clearAllResponses() {
  await kv.set(RESPONSES_KEY, []);
}

export async function deleteResponseById(id) {
  const current = await getAllResponses();
  const next = current.filter(row => row && typeof row === 'object' && row.id !== id);
  await kv.set(RESPONSES_KEY, next);
  return current.length - next.length;
}

