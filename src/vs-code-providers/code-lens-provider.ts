import * as vscode from 'vscode';

export class CommentCodeLensProvider implements vscode.CodeLensProvider {
  // Генерируем CodeLens над выделенными фрагментами текста
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const regex = /\/\*\*[\s\S]*?\*\//g; // Регулярка для поиска комментариев

    // Ищем все комментарии в документе
    const text = document.getText();
    let match;
    while ((match = regex.exec(text)) !== null) {
      const startPos = document.positionAt(match.index); // Начальная позиция
      const endPos = document.positionAt(match.index + match[0].length + 2); // Конечная позиция
      const range = new vscode.Range(startPos, endPos); // Диапазон комментария

      // Добавляем кнопку "Удалить"
      codeLenses.push(
        new vscode.CodeLens(range, {
          title: "Удалить комментарий", // Надпись на кнопке
          command: "f-doc.deleteComment", // Команда
          arguments: [document, range], // Аргументы для команды
        })
      );
    }
    return codeLenses;
  }

  resolveCodeLens(codeLens: vscode.CodeLens): vscode.CodeLens {
    return codeLens; // Возвращаем CodeLens как есть
  }
}