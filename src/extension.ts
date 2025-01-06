// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { connectCommand } from './db';
import { registerPostgresQueryCommand } from './postgres-query';
import { Client } from 'pg';
import { scanningFiles, indexingFiles } from './core/files-processing';
import { insertFormattedCodeComment } from './commands/insert-formatted-code-comment';
import { createAndOpenFixture } from './commands/create-and-open-fixture';
import { startCommitDelete } from './commands/delete-comment-in-code';
import { promiseWithProgress } from './vs-code-api/notification';
import { openWebView } from './commands/open-web-view';


async function beforeActivate(): Promise<void> {
	await scanningFiles();
	await indexingFiles();
}

promiseWithProgress([beforeActivate()], 'Активация расширения...', 'Активация выполнена успешно');

export async function activate(context: vscode.ExtensionContext) {
	const showVebView = vscode.commands.registerCommand('f-doc.openWebView', () => openWebView(context));
	const runSelectedCodeInCurrentFile = vscode.commands.registerCommand('f-doc.runSelectedCodeInFile', insertFormattedCodeComment);
	const runSelectedCodeInAnotherFile = vscode.commands.registerCommand('f-doc.runSelectedCodeAndOpenFile', createAndOpenFixture);

	context.subscriptions.push(showVebView);
	context.subscriptions.push(runSelectedCodeInCurrentFile);
	context.subscriptions.push(runSelectedCodeInAnotherFile);
	startCommitDelete(context);
}

// This method is called when your extension is deactivated
export function deactivate() { }
