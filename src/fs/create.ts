import fs from 'node:fs';

export function createDirectory(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true });
}