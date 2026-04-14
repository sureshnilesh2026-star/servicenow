export interface ApiScenario {
  id: string;
  title: string;
  user: string;
  issue: string;
  question: string;
  expectedPath: string;
  rawText: string;
}

export async function getScenarios(): Promise<ApiScenario[]> {
  const res = await fetch('/api/scenarios');
  if (!res.ok) throw new Error(`Failed to fetch scenarios: ${res.status}`);
  return res.json();
}

