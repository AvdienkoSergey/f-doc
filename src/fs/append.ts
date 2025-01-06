import fs from 'node:fs';

export function appendFileSync(filePath: string, data: string): void {
  fs.appendFileSync(filePath, data);
}

export async function appendFile(filePath: string, data: string): Promise<void> {
  await fs.promises.appendFile(filePath, data);
}