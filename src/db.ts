import * as vscode from 'vscode';
import { Client } from 'pg';

export async function connectCommand() {
  const host = 'localhost';
  const port = '5432';
  const user = 'postgres';
  const password = '123456789';
  const database = 'postgres';

  if (!host || !port || !user || !password || !database) {
    vscode.window.showErrorMessage('All fields are required!');
    return;
  }

  try {
    const client = new Client({
      host,
      port: parseInt(port),
      user,
      password,
      database,
    });
    await client.connect();

    vscode.window.showInformationMessage('Connected to PostgreSQL successfully!');
    return client;
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(`Failed to connect to PostgreSQL: ${error.message}`);
    } else {
      vscode.window.showErrorMessage(`Failed to connect to PostgreSQL: ${error}`);
    }
  }
};