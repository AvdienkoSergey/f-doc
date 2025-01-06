import * as fs from "fs/promises";
import { Stats } from "fs";

export async function statFiles(fileNames: string[]): Promise<PromiseSettledResult<Stats>[]> {
  const promises = fileNames.map((fileName) => fs.lstat(fileName));
  const results = await Promise.allSettled(promises);
  return results;
}

export async function statFile(fileName: string): Promise<Stats> {
  return fs.lstat(fileName);
}