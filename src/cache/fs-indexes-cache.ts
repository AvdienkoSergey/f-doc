const cacheIndex = new Map();

export function addToCacheIndexes(f_Path: string, data: unknown) {
  cacheIndex.set(f_Path, data);
}

export function getToCacheIndexes(f_Path: string): unknown {
  return cacheIndex.get(f_Path);
}

export function deleteToCacheIndexes(f_Path: string): void {
  cacheIndex.delete(f_Path);
}

export function clearCacheIndexes(): void {
  cacheIndex.clear();
}

export function existsToCacheIndexes(f_Path: string): boolean {
  return cacheIndex.has(f_Path);
}

export function countToCacheIndexes(): number {
  return cacheIndex.size;
}

export function allCacheIndexes(): Map<string, unknown> {
  return cacheIndex;
}