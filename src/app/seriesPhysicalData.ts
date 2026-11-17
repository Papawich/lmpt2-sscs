/**
 * Ship Series V5 physical-data draft prefill.
 * This deliberately does NOT mutate the representative, submitted, or approved studies.
 * The target must be a draft study. Values already entered on the target take precedence.
 */
export const SERIES_PHYSICAL_PARTS = [
  { key: 'general', label: 'General Information: containment, gas management, dimensions' },
  { key: 'fender', label: 'Flat Body, Fender Reaction, Berthing Energy' },
  { key: 'mooring', label: 'Mooring Arrangement, rope, pattern and images' },
  { key: 'gangway', label: 'Gangway (including images)' },
  { key: 'unloading', label: 'Unloading Arm (including images)' },
  { key: 'cargo', label: 'Cargo Management' },
  { key: 'shiplink', label: 'Ship Shore Link System' },
  { key: 'utility', label: 'Utility System' },
] as const;
export type PhysicalPart = (typeof SERIES_PHYSICAL_PARTS)[number]['key'];

export const SERIES_GENERAL_ITEM_IDS = new Set([
  'gi-09', 'gi-12', 'gi-13',
  ...Array.from({length: 12}, (_, i) => `gi-${String(i + 14).padStart(2, '0')}`),
]);

function blank(v: unknown): boolean {
  return v === null || v === undefined || v === '' || v === '—';
}

/** Fill only empty entries (including blank cells in fixed-size arrays). */
export function fillMissing<T>(target: T, source: T): T {
  if (source === undefined || source === null) return target;
  if (blank(target)) return structuredClone(source);
  if (Array.isArray(source)) {
    if (!Array.isArray(target)) return target;
    if (!target.length) return structuredClone(source) as T;
    return target.map((item, index) => index < source.length
      ? fillMissing(item, source[index]) : item) as T;
  }
  if (typeof source === 'object' && !Array.isArray(source) && typeof target === 'object' && target && !Array.isArray(target)) {
    // Uploaded media is atomic: preserve all source metadata before the caller
    // rewrites its storagePath to a new study-scoped copy.
    if ('storagePath' in source && !('storagePath' in (target as object)))
      return structuredClone(source); 
    if (Object.keys(target).length === 0) return structuredClone(source);
    const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
    for (const key of Object.keys(source)) {
      // Never replace identity, audit or generated IDs on nested table rows.
      if (['id', 'studyId', 'vesselId', 'uploadedBy', 'createdAt'].includes(key)) continue;
      result[key] = fillMissing(result[key], (source as Record<string, unknown>)[key]);
    }
    return result as T;
  }
  return target;
}

export type PhysicalStudyLike = {
  items: Array<{ id: string; value: string }>;
  flatBodyData: unknown; fenderReactionData: unknown; berthingEnergyData: unknown;
  mooringArrangementData: unknown; gangwayData: unknown; unloadingArmData: unknown;
  cargoManagementData: unknown; shipShoreLinkData: unknown; utilityData: unknown;
};

export function previewPhysicalMerge<T extends PhysicalStudyLike>(
  target: T, source: T, parts: readonly PhysicalPart[],
): T {
  const selected = new Set(parts);
  const result: Record<string, unknown> = { ...target };
  if (selected.has('general')) {
    const refItems = new Map(source.items.map(item => [item.id, item]));
    result.items = target.items.map(item => {
      if (!SERIES_GENERAL_ITEM_IDS.has(item.id) || !blank(item.value)) return item;
      const value = refItems.get(item.id)?.value;
      return value && !blank(value) ? { ...item, value } : item;
    });
  }
  const map: Array<[PhysicalPart, (keyof PhysicalStudyLike)[]]> = [
    ['fender', ['flatBodyData', 'fenderReactionData', 'berthingEnergyData']],
    ['mooring', ['mooringArrangementData']],
    ['gangway', ['gangwayData']],
    ['unloading', ['unloadingArmData']],
    ['cargo', ['cargoManagementData']],
    ['shiplink', ['shipShoreLinkData']],
    ['utility', ['utilityData']],
  ];
  for (const [part, keys] of map) if (selected.has(part)) for (const key of keys)
    result[key] = fillMissing(target[key], source[key]);
  // Berthing-energy displacement should follow the draft's effective General Information,
  // while leaving an already-entered berthing-energy value intact.
  if (selected.has('general') && selected.has('fender')) {
    const displacement = (result.items as T['items']).find(item => item.id === 'gi-22')?.value;
    const b = result.berthingEnergyData;
    if (displacement && b && typeof b === 'object' && blank((b as Record<string, unknown>).displacement))
      result.berthingEnergyData = { ...(b as Record<string, unknown>), displacement };
  }
  return result as T;
}

/** Find uploaded media introduced from a reference, so that the caller can make
 * independent Storage copies before saving a draft. Keeping source storagePaths
 * directly would break existing study-scoped Storage RLS for ship officers. */
export async function copyIntroducedMedia<T>(
  original: T, merged: T,
  copy: (file: { id: string; name: string; size: number; type: string; uploadedAt: string; storagePath: string }, path: string) => Promise<unknown>,
): Promise<T> {
  const existing = new Set<string>();
  function collect(value: unknown): void {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(collect); return; }
    const obj = value as Record<string, unknown>;
    if (typeof obj.storagePath === 'string') existing.add(obj.storagePath);
    Object.values(obj).forEach(collect);
  }
  collect(original);
  const copies = new Map<string, unknown>();
  async function walk(value: unknown, path: string): Promise<unknown> {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return Promise.all(value.map((item, i) => walk(item, `${path}.${i}`)));
    const obj = value as Record<string, unknown>;
    if (typeof obj.storagePath === 'string' && typeof obj.name === 'string' &&
        typeof obj.id === 'string' && !existing.has(obj.storagePath)) {
      if (!copies.has(obj.storagePath)) {
        const copied = await copy(obj as {id:string;name:string;size:number;type:string;uploadedAt:string;storagePath:string}, path);
        copies.set(obj.storagePath, copied);
      }
      return copies.get(obj.storagePath);
    }
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) result[key] = await walk(val, `${path}.${key}`);
    return result;
  }
  return await walk(merged, 'study') as T;
}


/** Count actual changed leaf values for a clear read-only preview. */
export function countPhysicalChanges(before: unknown, after: unknown): number {
  if (Object.is(before, after)) return 0;
  if (Array.isArray(after)) {
    if (!Array.isArray(before)) return after.length;
    return after.reduce((n, value, i) => n + countPhysicalChanges(before[i], value), 0);
  }
  if (after && typeof after === 'object') {
    if (typeof before !== 'object' || !before) return 1;
    return Object.entries(after).reduce((n, [key, value]) =>
      n + countPhysicalChanges((before as Record<string, unknown>)[key], value), 0);
  }
  return 1;
}
