import fs from 'node:fs';

export function removeSync(filePath: string): void {
  fs.rmSync(filePath);
}

export async function remove(filePath: string): Promise<void> {
  await fs.promises.rm(filePath);
}