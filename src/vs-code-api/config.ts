import * as vscode from 'vscode';

export interface IScanningConfig {
  directories: string[];
  extensions: string[];
  alias: string;
}

export interface IVmContextMocksConfig {
  [key: string]: string;
}

export interface IDocsConfig {
  [key: string]: string;
}

export interface ICongig {
  init: boolean;
  scanning: IScanningConfig;
  vmContextMocks: IVmContextMocksConfig;
  docs: IDocsConfig;
}

export const CONFIG: ICongig = {
  init: false,
  scanning: {
    directories: [],
    extensions: [],
    alias: '',
  },
  vmContextMocks: {},
  docs: {},
};

export type TConfigName = 'scanning' | 'vmContextMocks' | 'docs';
export type TConfigRootName = 'f-doc';

/**
 * Retrieves the configuration file for the 'f-doc' extension.
 * 
 * @returns {vscode.WorkspaceConfiguration} The configuration file.
 */
export function findConfigFile(name: TConfigRootName): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(name);
}

/**
 * Retrieves and initializes the configuration for the 'f-doc' extension.
 * 
 * This function checks if the configuration has already been initialized. If not,
 * it fetches the configuration settings from the VS Code workspace and assigns them
 * to the CONFIG object. The settings include directories to scan, file extensions to
 * consider, an alias for scanning, VM context mocks, and documentation mappings.
 * 
 * @returns {ICongig} The initialized configuration object.
 */
function getConfig(): ICongig {
  if (!CONFIG.init) {
    const config = vscode.workspace.getConfiguration('f-doc');
    const directories = config.get<string[]>('scanning.directories', []);
    const extensions = config.get<string[]>('scanning.extensions', []);
    const alias = config.get<string>('scanning.alias', '');
    const vmContextMocks = config.get<Record<string, string>>('vmContextMocks', {});
    const docs = config.get<Record<string, string>>('docs', {});

    CONFIG.scanning.directories = directories;
    CONFIG.scanning.extensions = extensions;
    CONFIG.scanning.alias = alias;
    CONFIG.vmContextMocks = vmContextMocks;
    CONFIG.docs = docs;
  }
  return CONFIG;
}

/**
 * Loads the scanning configuration.
 *
 * @returns {Promise<IScanningConfig>} A promise that resolves to the scanning configuration.
 */
export function loadScanningConfig(): IScanningConfig {
  const config = getConfig();
  return config.scanning;
}

/**
 * Loads the VM context mocks configuration.
 *
 * @returns {Promise<IVmContextMocksConfig>} A promise that resolves to the VM context mocks configuration.
 */
export async function loadVmContextMocksConfig(): Promise<IVmContextMocksConfig> {
  return new Promise((resolve, reject) => {
    const config = getConfig();
    resolve(config.vmContextMocks);
  });
}

/**
 * Loads the documentation configuration.
 *
 * @returns {Promise<IDocsConfig>} A promise that resolves to a record containing the documentation configuration.
 */
export async function loadDocsConfig(): Promise<IDocsConfig> {
  return new Promise((resolve, reject) => {
    const config = getConfig();
    resolve(config.docs);
  });
}