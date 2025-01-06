import * as vscode from 'vscode';

/**
 * Opens a text document in the editor.
 *
 * @param uri - The URI of the text document to open.
 * @returns A Thenable that resolves to the opened text document.
 */
export function showTextDocument(uri: vscode.Uri): Thenable<vscode.TextDocument> {
  return vscode.workspace.openTextDocument(uri);
}

/**
 * Retrieves the currently active text editor in Visual Studio Code.
 * If no editor is active, an error message is displayed and an error is thrown.
 *
 * @returns {vscode.TextEditor} The active text editor.
 * @throws {Error} If there is no active text editor.
 */
export function getEditor(): vscode.TextEditor {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    throw new Error('No active editor');
  }
  return editor;
}

/**
 * Retrieves the currently selected text from the given text editor.
 *
 * @param editor - The VS Code text editor instance from which to get the selected text.
 * @returns The text currently selected in the editor.
 */
export function getSelectedText(editor: vscode.TextEditor): string {
  const selection = editor.selection;
  return editor.document.getText(selection);
}

/**
 * Retrieves the workspace folders currently open in VS Code.
 *
 * @returns {readonly vscode.WorkspaceFolder[] | undefined} An array of workspace folders, or undefined if no folders are open.
 */
export function getWorkspaceFolders(): readonly vscode.WorkspaceFolder[] {
  const folder = vscode.workspace.workspaceFolders;
  if (!folder) {
    throw new Error('No workspace folder found!');
  }
  return folder;
}

/**
 * Converts a file path string to a `vscode.Uri` object.
 *
 * @param f_path - The file path as a string.
 * @returns A `vscode.Uri` object representing the file path.
 */
export function getFilePath(f_path: string): vscode.Uri {
  return vscode.Uri.file(f_path);
}

/**
 * Displays the given text document in a new editor beside the currently active one.
 *
 * @param document - The text document to be displayed.
 * @returns A promise that resolves when the document is shown.
 */
export async function showDocumentBeside(document: vscode.TextDocument): Promise<void> {
  await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
}

/**
 * Retrieves the file path of the currently active text editor in VS Code.
 *
 * @returns {string | undefined} The file path of the active text editor, or `undefined` if no editor is active.
 */
export function getPathToEditor(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    return editor.document.fileName;
  }
}

/**
 * Retrieves the root directory of the currently opened workspace.
 *
 * @returns {string | undefined} The file system path of the root directory, or `undefined` if no workspace folder is open.
 *
 * @remarks
 * If no workspace folder is open, an error message is displayed to the user.
 */
export function getRootDirectory(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder is open.');
    return undefined;
  }

  return workspaceFolders[0].uri.fsPath;
}