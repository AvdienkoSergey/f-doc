import path from "path";
import { IImportingDependencies, importingDependencies } from "../dependency-analysis/vue-file-imports";

export async function createVueCohensionTree(path_file: string, dependencies: string[]) {

  if (!path_file) {
    return;
  }

  interface IComponentTreeItem {
    id: string;
    name: string;
    path: string;
    title: string;
    x: number;
    y: number;
    children: IComponentTreeItem[];
  }

  const COMPONENT_HORIZONTAL_SPACING = 100;
  const COMPONENT_VERTICAL_SPACING = 60;

  async function generateCohensionTree(
    importsMap: IImportingDependencies,
    title: string,
    x: number,
    y: number,
    ROOT_COMPONENT_NAME: string
  ): Promise<IComponentTreeItem> {
    const treeItem: IComponentTreeItem = {
      id: `Cohesion_${ROOT_COMPONENT_NAME}`,
      name: ROOT_COMPONENT_NAME,
      title: title ? title : ROOT_COMPONENT_NAME,
      path: importsMap.filePath,
      x,
      y,
      children: [],
    };

    let childIndex = 1;

    for (const dependency_path of dependencies) {
      const _importsMap: IImportingDependencies = await importingDependencies(dependency_path);
      const COMPONENT_NAME = _importsMap.fileName;
      const childTreeItem: IComponentTreeItem = {
        id: `Cohesion_${COMPONENT_NAME}`,
        name: COMPONENT_NAME,
        title: title ? title : COMPONENT_NAME,
        path: _importsMap.filePath,
        x: x + childIndex * COMPONENT_HORIZONTAL_SPACING,
        y: y + COMPONENT_VERTICAL_SPACING,
        children: [],
      };

      treeItem.children.push(childTreeItem);
      childIndex++;
    }

    return treeItem;
  }

  const importsMap: IImportingDependencies = await importingDependencies(path_file);
  const ROOT_COMPONENT_NAME = importsMap.fileName;
  const componentsTree = await generateCohensionTree(importsMap, "", 10, 10, ROOT_COMPONENT_NAME);

  return componentsTree;
}