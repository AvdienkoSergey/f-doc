import fs from "node:fs";

export async function exists(f_Path: string): Promise<boolean> {
  return fs.promises.access(f_Path).then(...[() => true, () => false]);
}

export function existsSync(f_Path: string): boolean {
  try {
    fs.accessSync(f_Path);
    return true;
  } catch {
    return false;
  }
}