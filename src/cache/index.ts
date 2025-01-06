import { addToCacheFiles, getToCacheFiles, deleteToCacheFiles, clearCacheFiles, existsToCacheFiles, countToCacheFiles, allCacheFiles } from './fs-files-cache';
import { addToCacheFolders, getToCacheFolders, deleteToCacheFolders, clearCacheFolders, existsToCacheFolders, countToCacheFolders, allCacheFolders } from './fs-folders-cache';
import { addToCacheIndexes, getToCacheIndexes, deleteToCacheIndexes, clearCacheIndexes, existsToCacheIndexes, countToCacheIndexes, allCacheIndexes } from './fs-indexes-cache';

const cacheController: {
  [key: string]: {
    add: (key: string, value: unknown) => void;
    get: (key: string) => unknown;
    delete: (key: string) => void;
    clear: () => void;
    exists: (key: string) => boolean;
    count: () => number;
    all: () => Map<string, unknown>;
  };
} = {
  files: {
    add: addToCacheFiles,
    get: getToCacheFiles,
    delete: deleteToCacheFiles,
    clear: clearCacheFiles,
    exists: existsToCacheFiles,
    count: countToCacheFiles,
    all: allCacheFiles
  },
  folders: {
    add: addToCacheFolders,
    get: getToCacheFolders,
    delete: deleteToCacheFolders,
    clear: clearCacheFolders,
    exists: existsToCacheFolders,
    count: countToCacheFolders,
    all: allCacheFolders
  },
  indexes: {
    add: addToCacheIndexes,
    get: getToCacheIndexes,
    delete: deleteToCacheIndexes,
    clear: clearCacheIndexes,
    exists: existsToCacheIndexes,
    count: countToCacheIndexes,
    all: allCacheIndexes
  }
};

export function addCache<T>(target: string, key: string, value: T): void {
  cacheController[target].add(key, value);
}

export function getCache<T>(target: string, key: string): T | null {
  return cacheController[target].get(key) as unknown as T || null;
}

export function deleteCache(target: string, key: string) {
  cacheController[target].delete(key);
}

export function clearCache(target: string) {
  cacheController[target].clear();
}

export function existsCache(target: string, key: string) {
  return cacheController[target].exists(key);
}

export function countCache(target: string) {
  return cacheController[target].count();
}

export function allCache(target: string) {
  return cacheController[target].all();
}