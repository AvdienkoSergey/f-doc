import * as vscode from "vscode";
import path, { resolve } from "path";
import { createVueComponentsTree } from "../konva/vue-components-diagram";
import { createVueCohensionTree } from "../konva/vue-cohension-diagram";
import { showErrorMessage, showInformationMessage, showWarningMessage } from "../vs-code-api/notification";
import { IDocsConfig, loadDocsConfig, loadVmContextMocksConfig, IVmContextMocksConfig } from "../vs-code-api/config";
import { getFilePath, getRootDirectory, showDocumentBeside, showTextDocument, getPathToEditor } from "../vs-code-api/fs";
import { getFile, normalizePath } from "../fs";
import { marked } from 'marked';
import { allCache, getCache } from "../cache";

/**
 * Функция для создания и отображения WebView панели.
 * @param context - Контекст расширения
 */
export function makeWebViewPanel(
  context: vscode.ExtensionContext,
) {
  // Получаем путь к текущему файлу
  const targetPath = getPathToEditor();
  if (!targetPath) {
    return;
  }
  // Создаём новую панель WebView
  const panel = vscode.window.createWebviewPanel(
    "Vue components diagram", // Идентификатор WebView
    "Vue components diagram", // Заголовок панели
    vscode.ViewColumn.One, // В какой колонке открывать панель
    {
      enableScripts: true, // Разрешаем выполнение скриптов
      retainContextWhenHidden: true, // Сохраняем состояние при скрытии панели
    }
  );

  function getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  const nonce = getNonce();

  // Устанавливаем HTML-контент для WebView
  panel.webview.html = getWebViewContent(
    panel.webview,
    context.extensionUri,
    nonce,
    path.basename(targetPath)
  );

  let cachePosition = "";

  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case "getComponentsDiagram":
          showInformationMessage(targetPath);
          const componentsTree = await createVueComponentsTree(targetPath);
          panel.webview.postMessage({
            command: "getDependencyOverview",
            text: JSON.stringify(componentsTree),
          });
          return;
        case "getCohesionAnalysis":
          showInformationMessage(targetPath);
          function getDependencyIndex(targetFile: string): string[] {
            const CACHE_INDEXES = 'indexes';
            const relolvedPath = normalizePath(targetFile);
            const importedBy = getCache<string[]>(CACHE_INDEXES, relolvedPath);
            if (!importedBy) {
              showWarningMessage("No dependencies found");
              return [];
            }
            return importedBy;
          }
          const cohesionTree = await createVueCohensionTree(
            targetPath,
            getDependencyIndex(targetPath)
          );
          panel.webview.postMessage({
            command: "getCohesionAnalysis",
            text: JSON.stringify(cohesionTree),
          });
          return;

        case "openFile":
          if (!message.text) {
            showErrorMessage("The attached data was not found");
            return;
          }
          // const mocksConfig: IVmContextMocksConfig = await loadVmContextMocksConfig();
          // if (Object.keys(mocksConfig).indexOf(message.text) === -1) {
          //   showErrorMessage("The attached data was not found");
          //   return;
          // }
          // const functionPath = path.resolve(getRootDirectory() as string, mocksConfig[message.text]);
          // const document = await showTextDocument(getFilePath(functionPath));
          // await showDocumentBeside(document);
          const _document = await showTextDocument(getFilePath(message.text));
          await showDocumentBeside(_document);
          return;

        case "getMarkdownContent":
          const docsConfig: IDocsConfig = await loadDocsConfig();
          if (Object.keys(docsConfig).indexOf(message.text) === -1) {
            showErrorMessage("The requested documentation was not found");
            return;
          }
          const filePath = path.resolve(getRootDirectory() as string, docsConfig[message.text]);
          const fileContent = await getFile(filePath);
          const markdownToHtml = marked(fileContent);
          // Отправить содержимое файла в WebView
          panel.webview.postMessage({
            command: "getMarkdownContentAnswer",
            text: `<div class="markdown">${markdownToHtml}</div>`,
          });
          return;
      }
    },
    undefined,
    context.subscriptions
  );
}

function getWebViewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  nonce: string,
  fileName: string
): string {
  // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
  const scriptMainUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "src", "media", "main.js")
  );
  const scriptKonvaUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "src", "media", "konva.js")
  );
  const scriptModalUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "src", "media", "modal.js")
  );
  // Do the same for the stylesheet.
  const styleResetUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "src", "media", "reset.css")
  );
  const styleVSCodeUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "src", "media", "vscode.css")
  );
  const styleMainUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "src", "media", "main.css")
  );
  const styleModalUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "src", "media", "modal.css")
  );
  const styleMarkdownUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "src", "media", "markdown.css")
  );
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'nonce-${nonce}'; img-src http://www.plantuml.com;">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">

			<link href="${styleResetUri}" rel="stylesheet">
			<link href="${styleVSCodeUri}" rel="stylesheet">
			<link href="${styleMainUri}" rel="stylesheet">
      <link href="${styleModalUri}" rel="stylesheet">
      <link href="${styleMarkdownUri}" rel="stylesheet">
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <script nonce="${nonce}" src="https://unpkg.com/konva@9/konva.min.js"></script>

      <title>Документация проекта</title>
  </head>
  <body>
      <section class="top-panel">
        <h1>${fileName}</h1>
        <div class="button-container">
          <button id="component-diagram">Обзор зависимостей</button>
          <button id="cohesion-analysis">Анализ зацепления</button>
          <button id="send-message-2">Движение данных</button>
          <button id="send-message-3">Используемые API</button>
          <button id="send-message-4">Сценарий использования</button>
          <button id="send-message-5">Реализация логики</button>
          <button id="send-message-6">Список тестов</button>
        </div>
        <div class="controls-panel">
          <i class="material-icons cursor-pointer" id="remember-location">save</i>
          <i class="material-icons cursor-pointer" id="restore-location">view_module</i>
        </div>
      </section>

      <div id="modal" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <div id="markdown-content"></div>
        </div>
      </div>
      <div id="svg-container"></div>
      <div id="container"></div>

      <script nonce="${nonce}" src="${scriptMainUri}"></script>
      <script nonce="${nonce}" src="${scriptKonvaUri}"></script>
      <script nonce="${nonce}" src="${scriptModalUri}"></script>
  </body>
  </html>
  `;
}
