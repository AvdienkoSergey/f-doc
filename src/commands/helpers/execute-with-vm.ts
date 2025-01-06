import { runCode } from '../../core/sandbox';
import { buetifyCode } from './buetify-code';

export async function executeWithVM(code: string): Promise<string> {
  const calculateCode = await runCode(code);
  const calculateCodeString = buetifyCode(calculateCode);
  return calculateCodeString;
}