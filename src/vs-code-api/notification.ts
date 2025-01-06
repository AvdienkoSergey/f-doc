import * as vscode from 'vscode';

/**
 * Displays an error message to the user in a VS Code notification.
 *
 * @param message - The error message to be displayed.
 */
export function showErrorMessage(message: string) {
  vscode.window.showErrorMessage(message);
}

/**
 * Displays an information message to the user in a VS Code notification.
 *
 * @param message - The information message to be displayed.
 */
export function showInformationMessage(message: string) {
  vscode.window.showInformationMessage(message);
}

/**
 * Displays a warning message to the user in a VS Code notification.
 *
 * @param message - The warning message to be displayed.
 */
export function showWarningMessage(message: string) {
  vscode.window.showWarningMessage(message);
}

/**
 * Displays a progress notification while waiting for multiple promises to resolve.
 *
 * @param promises - An array of promises to wait for.
 * @param title - The title of the progress notification.
 * @param message - The message to display when the progress is complete.
 * @returns A promise that resolves when all the input promises have resolved.
 */
export async function promiseWithProgress(promises: Promise<void>[], title: string, message: string) {
  console.log('promiseWithProgress', promises, title, message);
  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: false,
    },
    async (progress) => {
      await Promise.all(promises);
      progress.report({
        message,
        increment: 100,
      });
    }
  );
}