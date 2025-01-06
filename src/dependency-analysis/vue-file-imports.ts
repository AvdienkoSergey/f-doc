import fs from "fs";
import path from "path";
import { parse } from "@vue/compiler-sfc";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { parseImports } from "../parsing/parse-imports";
import { getCache } from "../cache";

/**
 * Интерфейс для хранения импортов.
 */
export interface IImportingDependencies {
  fileName: string;
  filePath: string;
  [key: string]: Map<string, string> | string;
}

/**
 * Кэш для хранения результатов анализа зависимостей.
 */
const cache: Map<string, IImportingDependencies> = new Map();

/**
 * Анализирует зависимости из Vue файла. Поиск импортов.
 * @param {string} filePath - Путь к .vue файлу.
 * @returns {Object} - Объект с импортами и вызовами функций.
 */

export async function importingDependencies(filePath: string): Promise<IImportingDependencies> {
  // Объект для хранения импортов
  const importsMap: {
    fileName: string;
    filePath: string;
    [key: string]: Map<string, string> | string;
  } = {
    fileName: path.basename(filePath),
    filePath,
  };
  // Проверить существует ли файл в системе
  if (!fs.existsSync(filePath)) {
    return importsMap;
  }
  // Проверка кэша
  if (cache.has(filePath)) {
    return cache.get(filePath) || importsMap;
  }

  // Чтение содержимого файла
  const code = getCache("files", filePath) as string || fs.readFileSync(filePath, 'utf-8');
  let scriptContent = '';
  // Определяем тип файла
  const fileExtension = path.extname(filePath);
  if (fileExtension === '.vue') {
    // Парсим Vue файл
    const { descriptor } = parse(code, {
      filename: path.basename(filePath),
      sourceRoot: path.dirname(filePath),
    });
    scriptContent = descriptor.scriptSetup?.content || descriptor.script?.content || '';
  } else if (fileExtension === '.ts' || fileExtension === '.js') {
    // Для файлов TS/JS
    scriptContent = code;
  } else {
    // Если расширение не поддерживается
    console.warn(`Unsupported file type: ${fileExtension}`);
    return importsMap;
  }
  // Если нет <script> секции, возвращаем пустой объект
  if (!scriptContent) {
    return importsMap;
  }

  try {
    // Парсим JS/TS код в AST
    const ast = parser.parse(scriptContent, {
      sourceType: "module",
      plugins: ["typescript"], // Если используется TypeScript
    });

    const imports: Map<string, Map<string, string>> = new Map();

    traverse(ast, {
      ImportDeclaration(path) {
        parseImports(path, imports);
      },
    });
    for (const [key, value] of imports) {
      importsMap[key] = value;
    }
    // Сохраняем результат в кэш
    cache.set(filePath, importsMap);
  } catch (error) {
    // Было бы неплохо обработать ошибку в случае неудачного парсинга
    // Логируем ошибку
    console.error("Error parsing script content", error);
  }

  return importsMap;
}