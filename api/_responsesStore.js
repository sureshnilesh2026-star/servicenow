import { Redis } from '@upstash/redis';

const RESPONSES_KEY = 'clustering:responses';
const inMemoryFallback = [];

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function getRedisClient() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function getStore() {
  const redis = getRedisClient();
  return redis;
}

function cloneRows(rows) {
  return rows.map(row => (row && typeof row === 'object' ? { ...row } : row));
}

function readFallbackRows() {
  return cloneRows(ensureArray(inMemoryFallback));
}

function writeFallbackRows(rows) {
  inMemoryFallback.length = 0;
  inMemoryFallback.push(...cloneRows(ensureArray(rows)));
}

export async function getAllResponses() {
  const store = await getStore();
  if (!store) return readFallbackRows();
  const value = await store.get(RESPONSES_KEY);
  return ensureArray(value);
}

export async function appendResponse(response) {
  const store = await getStore();
  if (!store) {
    const current = readFallbackRows();
    current.push(response);
    writeFallbackRows(current);
    return;
  }
  const current = await getAllResponses();
  current.push(response);
  await store.set(RESPONSES_KEY, current);
}

export async function clearAllResponses() {
  const store = await getStore();
  if (!store) {
    writeFallbackRows([]);
    return;
  }
  await store.set(RESPONSES_KEY, []);
}

export async function deleteResponseById(id) {
  const store = await getStore();
  if (!store) {
    const current = readFallbackRows();
    const next = current.filter(row => row && typeof row === 'object' && row.id !== id);
    writeFallbackRows(next);
    return current.length - next.length;
  }
  const current = await getAllResponses();
  const next = current.filter(row => row && typeof row === 'object' && row.id !== id);
  await store.set(RESPONSES_KEY, next);
  return current.length - next.length;
}

