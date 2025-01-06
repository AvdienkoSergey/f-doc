import fs, { FSWatcher, Stats } from 'node:fs';

export function watchDirectory(folderPath: string): FSWatcher {
  return fs.watch(folderPath);
}

export function watchFile(filePath: string, callback: (curr: Stats, prev: Stats) => void): void {
  fs.watchFile(filePath, callback);
}