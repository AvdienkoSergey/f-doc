import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { loadScanningConfig, IScanningConfig } from '../vs-code-api/config';

export function parseImports(
  path: NodePath<t.ImportDeclaration>,
  imports: Map<string, Map<string, string>>
): Map<string, Map<string, string>> {
  const config: IScanningConfig = loadScanningConfig();
  const aliasUsed = config.alias;
  const watchedDirectories = config.directories;
  const validExtensions = config.extensions; // Пример: [".ts", ".vue"]
  let source = path.node.source.value;

  if (source.startsWith(aliasUsed)) {
    // Добавляем расширение, если его нет в пути
    const hasValidExtension = validExtensions.some((ext) =>
      source.endsWith(ext)
    );
    // Путь импорта начинается с псевдонима
    let resolvedPath = source.replace(aliasUsed, "..");
    if (!hasValidExtension) {
      // Предполагаем по умолчанию ".ts", если нет расширения
      resolvedPath += ".ts";
    }
    const currentDirectory = resolvedPath.split("/")[1];
    // Проверяем, что путь соответвует одной из директорий
    const isWatchedDirectory = watchedDirectories.some((dir) =>
      `/${currentDirectory}` === dir
    );

    if (isWatchedDirectory) {
      // Проверяем, что директория добавлена в коллекцию imports
      if (!imports.has(currentDirectory)) {
        imports.set(currentDirectory, new Map());
      }
      // Сохраняем имена импортируемых модулей
      path.node.specifiers.forEach((specifier) => {
        if (specifier.type === "ImportSpecifier" || specifier.type === "ImportDefaultSpecifier") {
          imports.get(currentDirectory)?.set(specifier.local.name, resolvedPath);
        }
      });
    }
  }

  return imports;
}