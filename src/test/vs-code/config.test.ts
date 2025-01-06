import { findConfigFile } from '../../vs-code-api/config';
import * as vscode from 'vscode';
// import jest from 'jest';

const ROOT_CONFIG_NAME = 'f-doc';

function testFindConfigFile_Functional() {
  const config = findConfigFile(ROOT_CONFIG_NAME);
  console.assert(config !== undefined, 'Config should not be undefined');
  console.assert(config.has('scanning'), 'Config should contain "scanning"');
  console.assert(config.has('docs'), 'Config should contain "docs"');
}

function testFindConfigFile_Performance() {
  console.time('findConfigFile');
  findConfigFile(ROOT_CONFIG_NAME);
  console.timeEnd('findConfigFile');
}

function testFindConfigFile_Security() {
  const config = findConfigFile(ROOT_CONFIG_NAME);
  console.assert(typeof config.get('scanning') === 'boolean', 'Scanning should be a boolean');
}

function testFindConfigFile_BlackBox() {
  const config = findConfigFile(ROOT_CONFIG_NAME);
  console.assert(config.get('docs') !== null, 'Docs config should not be null');
}

// function testFindConfigFile_WhiteBox() {
//   const mockGetConfig = jest.spyOn(vscode.workspace, 'getConfiguration');
//   findConfigFile(ROOT_CONFIG_NAME);
//   console.assert(mockGetConfig.mock.calls.length > 0, 'getConfiguration should be called');
//   mockGetConfig.mockRestore();
// }

function testFindConfigFile_Regression() {
  const config = findConfigFile(ROOT_CONFIG_NAME);
  console.assert(config.has('scanning'), 'Regression: scanning should still exist');
  console.assert(config.has('docs'), 'Regression: docs should still exist');
}

function testFindConfigFile_Exploratory() {
  const config = findConfigFile(ROOT_CONFIG_NAME);
  console.log(config); // Проверка нестандартных значений в конфиге.
}

function runTests() {
  testFindConfigFile_Functional();
  testFindConfigFile_Performance();
  testFindConfigFile_Security();
  testFindConfigFile_BlackBox();
  // testFindConfigFile_WhiteBox();
  testFindConfigFile_Regression();
  testFindConfigFile_Exploratory();
}

runTests();