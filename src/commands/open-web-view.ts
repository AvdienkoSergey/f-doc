import * as vscode from 'vscode';
import { makeWebViewPanel } from '../web-view/make-web-view';

export function openWebView(context: vscode.ExtensionContext) {
  makeWebViewPanel(context);
};