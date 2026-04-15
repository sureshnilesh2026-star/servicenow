export interface ParticipantResponse {
  id: string;
  timestamp: number;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  city: string;
  bankExperienceYears: number;
  scenarioId: string;
  scenarioTitle: string;
  level1: string;
  level1Label: string;
  level2: string;
  level2Label: string;
  level3: string;
  level3Label: string;
  selectedPath?: string;
  expectedPath: string;
  result: 'CORRECT' | 'WRONG';
}

const STORAGE_KEY = 'clustering-study-responses';
const CURRENT_PARTICIPANT_KEY = 'clustering-study-current-participant';

export interface ParticipantInfo {
  id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  city: string;
  bankExperienceYears: number;
}

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function apiSend(url: string, init: RequestInit): Promise<void> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
}

function canUseLocalFallback(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  );
}

export async function saveResponse(response: ParticipantResponse): Promise<void> {
  // Prefer API store; fallback to browser storage only in local development.
  try {
    await apiSend('/api/responses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(response),
    });
    return;
  } catch {
    if (!canUseLocalFallback()) throw new Error('Unable to save response');
    const responses = await getResponses();
    responses.push(response);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
  }
}

export async function getResponses(): Promise<ParticipantResponse[]> {
  try {
    return await apiGet<ParticipantResponse[]>('/api/responses');
  } catch {
    if (!canUseLocalFallback()) return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export async function clearResponses(): Promise<void> {
  try {
    await apiSend('/api/responses', { method: 'DELETE' });
  } catch {
    if (!canUseLocalFallback()) throw new Error('Unable to clear responses');
  }
  if (canUseLocalFallback()) localStorage.removeItem(STORAGE_KEY);
}

export async function deleteResponse(id: string): Promise<void> {
  try {
    await apiSend(`/api/responses/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch {
    if (!canUseLocalFallback()) throw new Error('Unable to delete response');
    const responses = await getResponses();
    const next = responses.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

export function setCurrentParticipant(info: ParticipantInfo): void {
  localStorage.setItem(CURRENT_PARTICIPANT_KEY, JSON.stringify(info));
}

export function getCurrentParticipant(): ParticipantInfo | null {
  const data =
    localStorage.getItem(CURRENT_PARTICIPANT_KEY) ||
    sessionStorage.getItem(CURRENT_PARTICIPANT_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearCurrentParticipant(): void {
  localStorage.removeItem(CURRENT_PARTICIPANT_KEY);
  sessionStorage.removeItem(CURRENT_PARTICIPANT_KEY);
}

export function generateCSV(responses: ParticipantResponse[]): string {
  const headers = [
    'Participant ID',
    'Timestamp',
    'Name',
    'Gender',
    'City',
    'Experience With Bank (Years)',
    'Scenario ID',
    'Scenario',
    'Navigation Path',
    'Expected Path',
    'Result',
  ];

  const rows = responses.map(r => [
    r.id,
    new Date(r.timestamp).toISOString(),
    r.name,
    r.gender,
    r.city,
    String(r.bankExperienceYears),
    r.scenarioId,
    r.scenarioTitle,
    r.selectedPath || `${r.level1Label} -> ${r.level2Label} -> ${r.level3Label}`,
    r.expectedPath,
    r.result,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
