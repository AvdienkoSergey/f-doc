import fs from 'node:fs';

export function writeFileSync(filePath: string, data: string): void {
  fs.writeFileSync(filePath, data);
}

export async function writeFile(filePath: string, data: string): Promise<void> {
  await fs.promises.writeFile(filePath, data);
}