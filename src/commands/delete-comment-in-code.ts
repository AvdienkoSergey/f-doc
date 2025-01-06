import * as vscode from 'vscode';
import { CommentCodeLensProvider } from '../vs-code-providers/code-lens-provider';

export function startCommitDelete(context: vscode.ExtensionContext) {
  // Регистрируем CodeLens провайдер для всех файлов с JavaScript и TypeScript
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [
        { scheme: 'file', language: 'typescript' }, // Поддержка TypeScript
        { scheme: 'file', language: 'javascript' }, // Поддержка JavaScript
        { scheme: 'file', language: 'vue' }         // Добавляем поддержку Vue
      ],
      new CommentCodeLensProvider()
    )
  );

  // Регистрируем команду удаления комментария
  context.subscriptions.push(
    vscode.commands.registerCommand('f-doc.deleteComment', (document: vscode.TextDocument, range: vscode.Range) => {
      const edit = new vscode.WorkspaceEdit();
      edit.delete(document.uri, range); // Удаляем текст в указанном диапазоне
      vscode.workspace.applyEdit(edit); // Применяем изменения
      vscode.window.showInformationMessage('Комментарий удалён!');
    })
  );
}