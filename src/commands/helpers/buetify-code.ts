/**
 * Transforms the provided `calculateCode` by formatting it using the `buetifyCode` function.
 *
 * @param calculateCode - The code string that needs to be formatted.
 * @returns The formatted code string.
 */
export function buetifyCode(code: any[]): string {
  return Array.isArray(code) && code.length === 1
    ? JSON.stringify(code[0], null, 2)
    : JSON.stringify(code, null, 2);
}
