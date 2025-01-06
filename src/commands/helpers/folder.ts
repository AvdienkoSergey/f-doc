import { createDirectoryIfNotExists, makePath } from '../../fs';
import { getWorkspaceFolders } from '../../vs-code-api/fs';

export function getFixtureFolder() {
  try {
    const workspaceFolders = getWorkspaceFolders();
    const pathToFixtureDir = makePath([workspaceFolders[0].uri.fsPath, '.f-doc/fixtures']);
    // TODO: Вынести побочный эффект в отдельную функцию
    createDirectoryIfNotExists(pathToFixtureDir);
    return pathToFixtureDir;
  } catch (error) {
    const errorMessage = 'Ошибка при работе с дректорией фикстур!';
    throw new Error(errorMessage);
  }
}