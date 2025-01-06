import * as path from "path";

import { exists, existsSync } from "./exists";
import { readFile, readDirectory } from "./read";
import { watchDirectory } from "./watch";
import { statFile } from "./stat";
import { addCache, getCache, deleteCache, existsCache } from "../cache/index";
import { createDirectory } from "./create";
import { writeFileSync } from "./write";

const CACHE_FILES = "files";
const CACHE_FOLDERS = "folders";

// function existsInFs(f_Path: string): Promise<boolean> {
//   return exists(f_Path);
// }

// function statInfo(f_Path: string): Promise<Stats> {
//   return statFile(f_Path);
// }

// async function getFiles(f_Path: string): Promise<string[]> {
//   return readDirectory(f_Path);
// }

export async function watchFileInFolder(f_Path: string): Promise<void> {
  watchDirectory(f_Path)
    .on("change", (eventType, filename) => {
      console.log(`File ${eventType} ${filename}`);
      console.log(`File ${filename} has been changed`);
    });
}

export async function getFile(f_Path: string): Promise<string> {
  if (existsCache(CACHE_FILES, f_Path)) {
    return Promise.resolve(getCache(CACHE_FILES, f_Path)!);
  } else {
    return readFile(f_Path)
      .then((data) => {
        const content = data as string;
        addCache(CACHE_FILES, f_Path, content);
        return content;
      })
      .catch((_) => {
        deleteCache(CACHE_FILES, f_Path);
        console.log(`File ${f_Path} not found`);
        return "";
      });
  }
}

export async function getPathsFileInFolder(
  f_Path: string,
  extentionsToScan: string[],
  scanResult: string[] = [],
): Promise<string[]> {
  let filesInFolder: string[] = [];

  if (existsCache(CACHE_FILES, f_Path)) {
    filesInFolder = getCache<string[]>(CACHE_FOLDERS, f_Path) || [];
  }

  const isExist = await exists(f_Path);

  if (isExist) {
    filesInFolder = await readDirectory(f_Path);
    addCache<string[]>(CACHE_FOLDERS, f_Path, filesInFolder);
  }

  for (const f of filesInFolder) {
    const fullPath = path.join(f_Path, f);
    const fileState = await statFile(fullPath);

    if (fileState.isDirectory()) {
      await getPathsFileInFolder(fullPath, extentionsToScan, scanResult);
    } else {
      if (
        extentionsToScan.length === 0 ||
        extentionsToScan.includes(path.extname(f))
      ) {
        scanResult.push(fullPath);
      }
    }
  }

  return Promise.resolve(scanResult);
}

/**
 * Constructs an absolute path by resolving the given array of path segments.
 *
 * @param paths - An array of path segments to be joined and resolved.
 * @returns The resolved absolute path as a string.
 * @example makePath(["/home", "user", "file.txt"]) => "/home/user/file.txt"
 */
export function makePath(paths: string[]): string {
  return path.resolve(paths.join("\\"));
}

/**
 * Creates a directory if it does not already exist.
 *
 * @param f_Path - The path of the directory to create.
 */
export function createDirectoryIfNotExists(f_Path: string): void {
  if (!existsSync(f_Path)) {
    createDirectory(f_Path);
  }
}

/**
 * Creates a file with the specified content at the given path.
 *
 * @param f_Path - The path where the file will be created.
 * @param content - The content to write to the file.
 * @returns void
 */
export function createFile(f_Path: string, content: string): void {
  return writeFileSync(f_Path, content);
}

/**
 * Normalizes the given path by converting backslashes to forward slashes.
 *
 * @param f_Path - The path to normalize.
 * @returns The normalized path as a string.
 */
export function normalizePath(f_Path: string): string {
  // Приводим к нормальному виду
  return path.normalize(f_Path).replace(/\\/g, "/");
}



