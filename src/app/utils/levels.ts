export interface NavigationOption {
  id: string;
  label: string;
  parent?: string;
  depth?: number;
}

export interface LevelsPayload {
  options: NavigationOption[];
}

export async function getLevels(): Promise<LevelsPayload> {
  const res = await fetch('/api/levels');
  if (!res.ok) throw new Error(`Failed to fetch levels: ${res.status}`);
  return res.json();
}

export function getChildOptions(
  parentId: string | undefined,
  levels: LevelsPayload,
): NavigationOption[] {
  return levels.options.filter(opt =>
    parentId ? opt.parent === parentId : !opt.parent,
  );
}

