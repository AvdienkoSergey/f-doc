import { IImportingDependencies, importingDependencies } from '../dependency-analysis/vue-file-imports';
import { allCache, addCache, getCache, deleteCache, existsCache, countCache } from '../cache';
import { getFile, getPathsFileInFolder, watchFileInFolder, normalizePath } from '../fs/index';
import { loadScanningConfig, IScanningConfig } from '../vs-code-api/config';
import { getRootDirectory } from '../vs-code-api/fs';

function preparingFiles(): {
  rootDirectory: string;
  directoriesToScan: string[];
  extentionsToScan: string[];
} {
  const config: IScanningConfig = loadScanningConfig();
  const rootDirectory = getRootDirectory() as string;
  return {
    rootDirectory,
    directoriesToScan: config.directories,
    extentionsToScan: config.extensions,
  };
}

export async function watchingFiles(): Promise<void> {
  const { rootDirectory, directoriesToScan } = preparingFiles();
  for (const dir of directoriesToScan) {
    watchFileInFolder(normalizePath(`${rootDirectory}${dir}`));
  }
  return Promise.resolve();
}

/**
 * Scans files in specified directories and processes them concurrently with a limit on the number of files processed at the same time.
 *
 * This function performs the following steps:
 * 1. Prepares the necessary directories and file extensions to scan.
 * 2. Scans the directories for files matching the specified extensions.
 * 3. Processes the scanned files concurrently with a specified limit on the number of concurrent tasks.
 *
 * @returns {Promise<void>} A promise that resolves when all files have been processed.
 *
 * @async
 */
export async function scanningFiles(): Promise<void> {

  const { rootDirectory, directoriesToScan, extentionsToScan } = preparingFiles();

  const scanResult: string[] = [];
  const fileContent: string[] = [];

  const dirPromises = directoriesToScan.map((dir) => getPathsFileInFolder(
    normalizePath(`${rootDirectory}${dir}`),
    extentionsToScan
  ));

  await Promise.allSettled(dirPromises).then((result) => {
    result.forEach((res) => {
      if (res.status === "fulfilled") {
        scanResult.push(...res.value);
      }
      if (res.status === "rejected") {
        console.error(res.reason);
      }
    });
  });

  // Добавляем очередь для обработки файлов поэтапно
  const CONCURRENT_LIMIT = 10; // Ограничение количества одновременно обрабатываемых файлов

  const processQueue = async (tasks: (() => Promise<any>)[], limit: number) => {
    const results: any[] = [];
    const executing: Promise<any>[] = [];

    for (const task of tasks) {
      const promise = task().then((result) => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });
      executing.push(promise);
      results.push(promise);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }

    return Promise.allSettled(results);
  };

  const fileTasks = scanResult.map((filePath) => () => getFile(filePath));

  const results = await processQueue(fileTasks, CONCURRENT_LIMIT);

  results.forEach((res) => {
    if (res.status === "fulfilled") {
      fileContent.push(res.value);
    }
    if (res.status === "rejected") {
      console.error(res.reason);
    }
  });

  return Promise.resolve();
}


/**
 * Asynchronously indexes files by processing their dependencies and updating caches.
 *
 * This function performs the following steps:
 * 1. Checks if there are any files in the cache and if there are already indexed files.
 * 2. Retrieves all cached files and creates a list of tasks to process each file.
 * 3. Processes the tasks with a concurrency limit to avoid overloading the system.
 * 4. For each file, it imports dependencies and updates the cache with the resolved paths.
 *
 * @returns {Promise<void>} A promise that resolves when all files have been indexed.
 */
export async function indexingFiles(): Promise<void> {

  const CONCURRENT_LIMIT = 10; // Ограничение количества одновременно обрабатываемых файлов
  const CACHE_INDEXES = 'indexes';
  const CACHE_FILES = 'files';
  const ROOT_DIRECTORY = getRootDirectory();

  if (countCache(CACHE_FILES) === 0 || countCache(CACHE_INDEXES) > 0) {
    return;
  }

  const cacheFiles = allCache(CACHE_FILES);
  const files = Array.from(cacheFiles.keys());

  const processQueue = async (tasks: (() => Promise<any>)[], limit: number) => {
    const results: any[] = [];
    const executing: Promise<any>[] = [];

    for (const task of tasks) {
      const promise = task().then((result) => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });
      executing.push(promise);
      results.push(promise);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  };

  const tasks = files.map((filePath) => async () => {
    const NUMBER_OF_REQUIRED_KEYS = 2;
    const importsMap: IImportingDependencies = await importingDependencies(filePath);
    const dependencyTypes = Object.keys(importsMap) as (keyof IImportingDependencies)[];
    if (dependencyTypes.length <= NUMBER_OF_REQUIRED_KEYS) {
      // Если файл не имеет зависимостей, пропускаем его
      return;
    }
    for (const type of dependencyTypes) {
      if (type === "fileName" || type === "filePath") {
        continue;
      }
      const imprts = importsMap[type] as Map<string, string>;
      const dependency = Array.from(imprts.values());
      dependency.forEach((importPath) => {
        const resolvedPath = normalizePath(`${ROOT_DIRECTORY}${importPath.replace("..", "")}`);
        if (!existsCache(CACHE_INDEXES, resolvedPath)) {
          addCache(CACHE_INDEXES, resolvedPath, []);
        }
        const _value = getCache<string[]>(CACHE_INDEXES, resolvedPath);
        _value?.push(normalizePath(filePath));
        addCache(CACHE_INDEXES, resolvedPath, _value);
      });
    }
  });

  await processQueue(tasks, CONCURRENT_LIMIT);
  console.log('Indexing files completed', allCache(CACHE_INDEXES));
  return;
}