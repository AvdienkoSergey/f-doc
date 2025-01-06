import * as vscode from "vscode";
import fs from "node:fs";
import path from "node:path";

import { ref, reactive, computed } from "@vue/reactivity";
import ts from "typescript";

const PARSING_TIMEOUT: number = 1000;
const EXECUTION_TIMEOUT = 5000;

import vm, { RunningScriptOptions } from "node:vm";
import { getRootDirectory } from "../vs-code-api/fs";
import { loadVmContextMocksConfig, IVmContextMocksConfig } from "../vs-code-api/config";
import { getFile } from "../fs/index";

// Чтение заглушек из настроек
async function loadMocks() {
  const config: IVmContextMocksConfig = await loadVmContextMocksConfig();

  const result: Record<string, any> = {};

  for (const key in config) {
    const rootDirectory = getRootDirectory()!;
    const mockPath = path.resolve(rootDirectory, config[key]);

    if (fs.existsSync(mockPath)) {
      try {

        const ext = path.extname(mockPath);

        switch (ext) {
          case ".json":
            const fixture = await getFile(mockPath);
            result[key] = new Function(`return () => (${fixture})`)();
            break;

          case ".js":
            const mockModule = await getFile(mockPath);
            result[key] = new Function(`return ${mockModule}`)();
            break;

          default:
            throw new Error(`Unsupported mock file extension: ${ext}`);
        }

      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to load mock ${key}: ${error?.message}`);
        }
      }
    } else {
      throw new Error(`Mock file not found: ${mockPath}`);
    }
  }

  return result;
}

let calculateCode: any[] = []; // Объявляем переменную для хранения найденных переменных

const safeConsole = {
  log: (...args: any[]) => {
    calculateCode = [...args]; // Сохраняем все аргументы в переменную
    console.log("[sandbox]", ...args);
  },
  error: (...args: any[]) => {
    calculateCode = [...args]; // Сохраняем все аргументы в переменную
    console.error("[sandbox]", ...args);
  },
};

/**
 * Executes the provided code and returns the result.
 *
 * @param code - The code to be executed.
 * @returns A promise that resolves with the result of the executed code.
 */
export async function runCode(code: string = "2 + 2"): Promise<unknown[]> {
  // Загружаем моки
  const safeMocks = await loadMocks();

  const context = vm.createContext({
    console: safeConsole,
    fetch,
    ...safeMocks,
    ref,
    reactive,
    computed,
  });
  try {
    // Добавляем транспиляцию кода
    function transpileTypeScript(code: string): string {
      const result = ts.transpileModule(code, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS, // Используем CommonJS для совместимости с vm
          target: ts.ScriptTarget.ES2020, // Современный JavaScript
          strict: true, // Включаем строгую проверку типов
          esModuleInterop: true, // Совместимость с ES-модулями
        },
      });
      return result.outputText;
    }
    // Добавляем в контекст асинхронность
    const asyncContext = `
      (async () => {
        try {
          ${transpileTypeScript(code)}
        } catch (e) {
          console.error(e.message); 
        }
      })();
    `;
    const script = new vm.Script(asyncContext, {
      timeout: PARSING_TIMEOUT,
    } as RunningScriptOptions);

    return Promise.resolve(
      script.runInContext(context, { timeout: EXECUTION_TIMEOUT })
    ).then(() => {
      const _calculateCode = calculateCode; // Сохраняем переменные
      calculateCode = []; // Очищаем переменные
      return _calculateCode; // Возвращаем их
    });
  } catch (e) {
    console.error("Parsing timeout");
    return [];
  }
}
