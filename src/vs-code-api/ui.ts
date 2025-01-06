import * as vscode from 'vscode';

/**
 * Displays a Quick Pick dropdown with the given items and placeholder text.
 *
 * @param items - An array of strings to display in the Quick Pick dropdown.
 * @param placeHolder - A placeholder string to display in the Quick Pick input box.
 * @returns A Thenable that resolves to the selected item as a string, or undefined if no item was selected.
 */
export function showQuickPick(items: string[], placeHolder: string): Thenable<string | undefined> {
  return vscode.window.showQuickPick(items, { placeHolder });
}

/**
 * Displays an input box with the given placeholder text.
 *
 * @param placeHolder - A placeholder string to display in the input box.
 * @returns A Thenable that resolves to the entered text as a string, or undefined if no text was entered.
 */
export function showInputBox(placeHolder: string): Thenable<string | undefined> {
  return vscode.window.showInputBox({ placeHolder });
}

/**
 * Displays an information message to the user.
 *
 * @param message - The message to display.
 */
export function showOpenDialog(options: vscode.OpenDialogOptions): Thenable<vscode.Uri[] | undefined> {
  return vscode.window.showOpenDialog(options);
}

/**
 * Displays an information message to the user.
 *
 * @param message - The message to display.
 */
export function showSaveDialog(options: vscode.SaveDialogOptions): Thenable<vscode.Uri | undefined> {
  return vscode.window.showSaveDialog(options);
}