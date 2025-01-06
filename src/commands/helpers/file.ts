import { makePath, createFile } from '../../fs';
import { showTextDocument, showDocumentBeside, getFilePath } from '../../vs-code-api/fs';

export function makeFilePath(paths: string[]): string {
  return makePath(paths);
}

export function createFixtureFile(filePath: string, data: string): void {
  createFile(filePath, data);
}

export async function openFixtureFile(filePath: string): Promise<void> {
  const document = await showTextDocument(getFilePath(filePath));
  await showDocumentBeside(document);
}