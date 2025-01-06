const cacheFiles = new Map();

export function addToCacheFiles(f_Path: string, data: unknown) {
  cacheFiles.set(f_Path, data);
}

export function getToCacheFiles(f_Path: string): unknown {
  return cacheFiles.get(f_Path);
}

export function deleteToCacheFiles(f_Path: string): void {
  cacheFiles.delete(f_Path);
}

export function clearCacheFiles(): void {
  cacheFiles.clear();
}

export function existsToCacheFiles(f_Path: string): boolean {
  return cacheFiles.has(f_Path);
}

export function countToCacheFiles(): number {
  return cacheFiles.size;
}

export function allCacheFiles(): Map<string, unknown> {
  return cacheFiles;
}