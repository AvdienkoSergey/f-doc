import {
  getEditor,
  getSelectedText
} from '../vs-code-api/fs';
import { executeWithVM } from './helpers/execute-with-vm';

export async function insertFormattedCodeComment() {
  const document = getEditor();
  const code = getSelectedText(document);
  const buetifyCode = await executeWithVM(code);

  document.edit(async (editBuilder) => {
    const position = document.selection.end;
    editBuilder.insert(position, `\n/**\n*\n${buetifyCode}\n*/`);
  });
}