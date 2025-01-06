import fs from "fs";
import path from "path";
import { parse } from "@vue/compiler-sfc";
import * as parser from "@babel/parser";
import traverse, { Node, NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import projection from "../utils/projection";
import { parse_UseState } from "./parse-use-store";
import { parseImports } from "./parse-imports";

interface FunctionCall {
  object: string; // Например, "useStore"
  property: string; // Например, "basket"
  functionName: string; // Например, "removeAllProducts"
  calledFrom: string; // Например, "useService.test"
}

interface Dependencies {
  callSequence: FunctionCall[];
  properties: { [objectName: string]: { [propertyName: string]: string[] } };
}

interface FunctionNode {
  name: string;
  children: FunctionNode[];
}

/**
 * Анализирует зависимости из Vue файла.
 * @param {string} vueFilePath - Путь к .vue файлу.
 * @returns {Object} - Объект с импортами и вызовами функций.
 */
export function analyzeVueFileDependencies(vueFilePath: string): {
  imports: {
    components: Map<string, string>;
    stores: Map<string, string>;
  };
  calls: Dependencies;
  callsTree: { [key: string]: FunctionNode };
} {
  // Читаем содержимое Vue файла
  const vueCode = fs.readFileSync(vueFilePath, "utf-8");

  // Парсим содержимое файла
  const { descriptor } = parse(vueCode, {
    filename: path.basename(vueFilePath),
    sourceRoot: path.dirname(vueFilePath),
  });

  // Извлекаем <script> секцию
  const scriptContent = descriptor.scriptSetup?.content || "";

  const dependencies: {
    imports: {
      components: Map<string, string>;
      stores: Map<string, string>;
    }
    calls: Dependencies;
    callsTree: { [key: string]: FunctionNode };
  } = {
    imports: {
      components: new Map(),
      stores: new Map(),
    },
    calls: { callSequence: [], properties: {} },
    callsTree: {},
  };

  // Если нет <script> секции, возвращаем пустой объект
  if (!scriptContent) {
    return dependencies;
  }

  // Парсим JS/TS код в AST
  try {
    const ast = parser.parse(scriptContent, {
      sourceType: "module",
      plugins: ["typescript"], // Если используется TypeScript
    });

    function findFunctionCalls(node: t.Node, calledFrom: string): void {
      traverse(
        node as any,
        {
          CallExpression(path) {
            const callee = path.node.callee;

            if (t.isIdentifier(callee)) {
              dependencies.calls.callSequence.push({
                object: "",
                property: "",
                functionName: callee.name,
                calledFrom,
              });
            } else if (t.isMemberExpression(callee)) {
              if (t.isIdentifier(callee.object) && t.isIdentifier(callee.property)) {
                dependencies.calls.callSequence.push({
                  object: callee.object.name,
                  property: "",
                  functionName: callee.property.name,
                  calledFrom,
                });
              }
            }
          },
        },
        // @ts-ignore
        path => path.skip()
      );
    }

    // Список объектов для анализа
    const targetObjects = ["useComposable", "useStore", "useService"];

    // const useStore = {
    //   displayRules: useDisplayRulesStore(),
    //   productHits: useProductHitsStore(),
    //   productSale: useProductSaleStore(),
    //   productNewest: useProductNewestStore(),
    //   basket: useBasketStore(),
    //   compare: useCompareStore(),
    //   favorite: useFavoriteStore(),
    //   profile: useProfileStore(),
    //   recently: useProductRecentlyWatchStore(),
    // };

    // interface BaseNode {
    //     type: Node["type"];
    //     leadingComments?: Comment[] | null;
    //     innerComments?: Comment[] | null;
    //     trailingComments?: Comment[] | null;
    //     start?: number | null;
    //     end?: number | null;
    //     loc?: SourceLocation | null;
    //     range?: [number, number];
    //     extra?: Record<string, unknown>;
    // }
    // Обходим AST

    const imports: Map<string, Map<string, string>> = new Map();

    traverse(ast, {
      ImportDeclaration(path) {
        // Сохраняем пути импортируемых модулей
        // const source = path.node.source.value;
        // path.node.specifiers.forEach((specifier) => {
        //   if (specifier.type === "ImportSpecifier" || specifier.type === "ImportDefaultSpecifier") {
        //     if (source.includes("~/components")) {
        //       dependencies.imports.components.set(specifier.local.name, source.replace("~", ".."));
        //     }
        //   }
        // });
        console.log("path", path);
        parseImports(path, imports);
      },
      ExportDeclaration(path: NodePath<t.ExportDeclaration>) { },
      ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) { },
      VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
        parse_UseState(path);
        // interface VariableDeclarator extends BaseNode {
        //   type: "VariableDeclarator";  // Тип узла - всегда "VariableDeclarator". Cтрока, идентифицирующая узел как VariableDeclarator
        //   id: LVal;                   // Идентификатор переменной или её шаблон. Cодержит LVal, который может быть идентификатором, деструктуризацией или другим левосторонним значением (LHS)
        //   init?: Expression | null;   // Начальное значение переменной (инициализация)
        //   definite?: boolean | null;  // Флаг для TypeScript (обязательно ли значение)
        // }
        // type LVal = 
        // Identifier | 
        // MemberExpression | 
        // RestElement | 
        // AssignmentPattern | 
        // ArrayPattern | 
        // ObjectPattern | 
        // TSParameterProperty | 
        // TSAsExpression | 
        // TSSatisfiesExpression | 
        // TSTypeAssertion | 
        // TSNonNullExpression;
        const id = path.node.id;

        if (t.isIdentifier(id) && targetObjects.includes(id.name)) {
          const objectName = id.name;
          const init = path.node.init;

          if (t.isObjectExpression(init)) {
            dependencies.calls.properties[objectName] = {};

            init.properties.forEach((property) => {
              if (t.isObjectProperty(property) && t.isIdentifier(property.key)) {
                const propertyName = property.key.name;
                const propertyValue = property.value;

                // Обработка ArrowFunctionExpression и вызовов
                if (t.isArrowFunctionExpression(propertyValue)) {
                  findFunctionCalls(propertyValue.body, `${objectName}.${propertyName}`);
                }
                // Прямой вызов функции
                else if (t.isCallExpression(propertyValue)) {
                  dependencies.calls.callSequence.push({
                    object: objectName,
                    property: propertyName,
                    functionName: (propertyValue.callee as t.Identifier)?.name || "",
                    calledFrom: objectName,
                  });
                }
              }
            });
          }
        }
      },
      CallExpression(path: NodePath<t.CallExpression>) {
        const callee = path.node.callee;

        if (t.isMemberExpression(callee) && t.isIdentifier(callee.object) && t.isIdentifier(callee.property)) {
          const objectName = callee.object.name;
          const functionName = callee.property.name;

          // Сохраняем вызов для всех целевых объектов
          if (targetObjects.includes(objectName)) {
            dependencies.calls.callSequence.push({
              object: objectName,
              property: "",
              functionName,
              calledFrom: path.parentPath?.toString() || "",
            });
          }
        }
      },
      ObjectExpression(path: NodePath<t.ObjectExpression>) {
        // interface ObjectExpression extends BaseNode {
        //     type: "ObjectExpression";
        //     properties: Array<ObjectMethod | ObjectProperty | SpreadElement>;
        // }
      }
    });

    // Функция для добавления вызовов в дерево
    function buildCallTree(sequence: FunctionCall[]) {
      // Хранение иерархической структуры вызовов
      const callTree: { [key: string]: FunctionNode } = {};
      sequence.forEach((call) => {
        const { calledFrom, functionName, object } = call;

        // Если вызов не имеет "calledFrom", это верхний уровень
        if (!calledFrom) {
          return;
        }

        // Найти или создать родительский узел
        if (!callTree[calledFrom]) {
          callTree[calledFrom] = { name: calledFrom, children: [] };
        }

        // Добавить дочерний вызов
        if (functionName) {
          callTree[calledFrom].children.push({ name: functionName, children: [] });
        } else if (object) {
          callTree[calledFrom].children.push({ name: object, children: [] });
        }
      });
      return callTree;
    }

    dependencies.callsTree = buildCallTree(dependencies.calls.callSequence);
    console.log("imports", imports);
    return dependencies;
  } catch (error) {
    console.error("Error parsing script content:", error);
    return dependencies;
  }
}
