import { importingDependencies, type IImportingDependencies } from '../dependency-analysis/vue-file-imports';
import { getRootDirectory } from '../vs-code-api/fs';
import { normalizePath } from '../fs/index';

export async function createVueComponentsTree(path_file: string) {
  const rootDirectory = getRootDirectory();

  if (!path_file || !rootDirectory) {
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

  /**
   * Рекурсивная генерация дерева компонентов.
   */
  async function generateComponentTree(
    importsMap: IImportingDependencies,
    title: string,
    x: number,
    y: number,
    ROOT_COMPONENT_NAME: string
  ): Promise<IComponentTreeItem> {
    // Создаем узел для текущего элемента
    const treeItem: IComponentTreeItem = {
      id: `${ROOT_COMPONENT_NAME}_${importsMap.fileName}`,
      name: importsMap.fileName,
      title: title ? title : importsMap.fileName,
      path: importsMap.filePath,
      x,
      y,
      children: [],
    };

    let sectionIndex = 0;

    // Перебираем все доступные типы зависимостей (динамически)
    const dependencyTypes = Object.keys(importsMap) as (keyof IImportingDependencies)[];

    for (const type of dependencyTypes) {
      // Пропускаем системные поля, если они не представляют зависимости
      if (type === "fileName" || type === "filePath") {
        continue;
      }

      const dependencyList = importsMap[type] as Map<string, string>;

      if (!dependencyList || dependencyList.size === 0) {
        continue;
      }

      // Создаём подузел для текущего типа зависимостей (например, components или hooks)
      const sectionNode: IComponentTreeItem = {
        id: `${ROOT_COMPONENT_NAME}_${importsMap.fileName}_${type}`,
        name: type as string, // Название секции
        path: "",
        title: type as string,
        x: x + sectionIndex * COMPONENT_HORIZONTAL_SPACING,
        y,
        children: [],
      };

      let childIndex = 0;

      // Перебираем элементы в данной секции
      for (const [dependencyName, dependencyPath] of dependencyList) {
        const _path = normalizePath(rootDirectory + dependencyPath.replace("../", "/"));
        const childImportsMap = await importingDependencies(_path);

        // Генерация дерева для зависимости
        const childTreeItem = await generateComponentTree(
          childImportsMap,
          dependencyName,
          sectionNode.x + childIndex * COMPONENT_HORIZONTAL_SPACING,
          sectionNode.y + COMPONENT_VERTICAL_SPACING,
          ROOT_COMPONENT_NAME
        );

        sectionNode.children.push(childTreeItem);
        childIndex++;
      }

      // Добавляем секцию как дочерний элемент к корневому узлу
      treeItem.children.push(sectionNode);
      sectionIndex++;
    }

    return treeItem;
  }

  // Строим дерево с динамическими зависимостями
  const importsMap: IImportingDependencies = await importingDependencies(path_file);
  const ROOT_COMPONENT_NAME = importsMap.fileName;
  const componentsTree = generateComponentTree(importsMap, "", 10, 10, ROOT_COMPONENT_NAME);

  return componentsTree;
}