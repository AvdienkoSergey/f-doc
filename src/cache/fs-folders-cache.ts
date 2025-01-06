const cacheFolders = new Map();

export function addToCacheFolders(f_Path: string, data: unknown): void {
  cacheFolders.set(f_Path, data);
}

export function getToCacheFolders(f_Path: string): unknown {
  return cacheFolders.get(f_Path);
}

export function deleteToCacheFolders(f_Path: string): void {
  cacheFolders.delete(f_Path);
}

export function clearCacheFolders(): void {
  cacheFolders.clear();
}

export function existsToCacheFolders(f_Path: string): boolean {
  return cacheFolders.has(f_Path);
}

export function countToCacheFolders(): number {
  return cacheFolders.size;
}

export function allCacheFolders(): Map<string, unknown> {
  return cacheFolders;
}