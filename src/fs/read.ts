import fs from 'node:fs';

export function readFileSync<T>(filePath: string): T {
  return fs.readFileSync(filePath, 'utf8') as unknown as T;
}

export async function readFile<T>(filePath: string): Promise<T> {
  return fs.promises.readFile(filePath, 'utf8') as unknown as Promise<T>;
}

export async function readFileStepByStep(filePath: string): Promise<fs.ReadStream> {
  return fs.createReadStream(filePath, 'utf8');
}

export function readDirectorySync<T>(directoryPath: string): T[] {
  return fs.readdirSync(directoryPath) as unknown as T[];
}

export async function readDirectory<T>(directoryPath: string): Promise<T[]> {
  return fs.promises.readdir(directoryPath) as unknown as Promise<T[]>;
}

export async function readDirectoryStepByStep(directoryPath: string): Promise<fs.Dir> {
  return fs.promises.opendir(directoryPath);
}