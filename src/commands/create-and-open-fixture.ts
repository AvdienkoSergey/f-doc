import {
  getEditor,
  getSelectedText
} from '../vs-code-api/fs';
import { executeWithVM } from './helpers/execute-with-vm';
import { getFixtureFolder } from './helpers/folder';
import { createFixtureFile, makeFilePath, openFixtureFile } from './helpers/file';

/**
 * Creates a new fixture file with the selected text from the editor, 
 * beautifies the code, and opens the fixture file.
 *
 * @returns {Promise<void>} A promise that resolves when the fixture file is created and opened.
 */
export async function createAndOpenFixture(): Promise<void> {
  const document = getEditor();
  const code = getSelectedText(document);
  const buetifyCode = await executeWithVM(code);
  const fixtureFolder = getFixtureFolder();
  const fixtureFilePath = makeFilePath([fixtureFolder, `fixture-${Date.now()}.json`]);

  createFixtureFile(fixtureFilePath, buetifyCode);
  return openFixtureFile(fixtureFilePath);
};