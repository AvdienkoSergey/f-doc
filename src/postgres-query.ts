import * as vscode from 'vscode';
import { Client } from 'pg';

/**
 * Регистрация команды "postgres.query".
 * @param context - Контекст расширения.
 */
export function registerPostgresQueryCommand(context: vscode.ExtensionContext, client: Client | undefined) {
  const queryCommand = vscode.commands.registerCommand('f-doc.query', async () => {

    if (!client) {
      vscode.window.showErrorMessage('No active PostgreSQL connection. Use "Postgres: Connect" to connect.');
      return;
    }

    const query = await vscode.window.showInputBox({ prompt: 'Enter your SQL query' });

    if (!query) {
      vscode.window.showErrorMessage('SQL query is required!');
      return;
    }

    try {
      const result = await client.query(query);
      vscode.window.showInformationMessage(`Query executed successfully. Rows affected: ${result.rowCount}`);
      console.log(JSON.stringify(result.rows, null, 2)); // Вывод результата в консоль
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to execute query: ${error.message}`);
    }
  });

  context.subscriptions.push(queryCommand);
}