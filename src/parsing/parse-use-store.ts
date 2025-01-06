import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

// interface VariableDeclarator extends BaseNode {
//   type: "VariableDeclarator";  // Тип узла - всегда "VariableDeclarator". Cтрока, идентифицирующая узел как VariableDeclarator
//   id: LVal;                   // Идентификатор переменной или её шаблон. Cодержит LVal, который может быть идентификатором, деструктуризацией или другим левосторонним значением (LHS)
//   init?: Expression | null;   // Начальное значение переменной (инициализация)
//   definite?: boolean | null;  // Флаг для TypeScript (обязательно ли значение)
// }

/**
 * AST узлы для UseState. Разбор зависимостей из Vue файла.
 * @param {NodePath} path - Путь к AST узлу.
 * @description Функция анализирует зависимости из Vue файла.
 * 1. VariableDeclaration. Объявление переменной useStore (const useStore = ...)
 * 1.1 Левосторонняя часть: Identifier с именем useStore
 * 1.2 Правосторонняя часть: Правосторонняя часть: ObjectExpression
 * 2. ObjectExpression. Объектное выражение
 * 2.1 Содержит массив Property, где каждый элемент имеет:
 * 2.1.1 Ключ: Identifier с именем свойства (например, { displayRules: ... })
 * 2.1.2 Значение: ArrowFunctionExpression или CallExpression или другое выражение
 ****************************************************************************************************
 * Представим что имеется импорт import { theThing } from '/stores/the-thing';
 * Внутри useStore ключ-значение правосторонней части может выглядеть так:
 * 1. { theKey: theThing } // AST-тип: Identifier
 * {
 *    "type": "Property",
 *    "key": { "type": "Identifier", "name": "theKey" },
 *    "value": { "type": "Identifier", "name": "theThing" },
 *    "kind": "init"
 * }
 * 2. { theKey: theThing() } // AST-тип: CallExpression
 * {
 *    "type": "Property",
 *    "key": { "type": "Identifier", "name": "theKey" },
 *    "value": {
 *        "type": "CallExpression",  
 *        "callee": { "type": "Identifier", "name": "theThing" },
 *        "arguments": []
 *   },
 *   "kind": "init"
 * }
 * 3. { theKey: () => theThing() } // AST-тип: ArrowFunctionExpression с CallExpression
 * {
 *    "type": "Property",
 *    "key": { "type": "Identifier", "name": "theKey" },
 *    "value": {
 *        "type": "ArrowFunctionExpression",
 *        "params": [],
 *        "body": {
 *          "type": "CallExpression",
 *          "callee": { "type": "Identifier", "name": "theThing" },
 *          "arguments": []
 *        },
 *        "async": false,
 *        "expression": true
 *    },
 *    "kind": "init"
 * }
 * 4. { theKey: () => { return theThing() } } // AST-тип: ArrowFunctionExpression с BlockStatement
 * {
 *    "type": "Property",
 *    "key": { "type": "Identifier", "name": "theKey" },
 *    "value": {
 *      "type": "ArrowFunctionExpression",
 *      "params": [],
 *      "body": {
 *        "type": "BlockStatement",
 *        "body": [
 *            {
 *               "type": "ReturnStatement",
 *               "argument": {
 *                  "type": "CallExpression",
 *                  "callee": { "type": "Identifier", "name": "theThing" },
 *                  "arguments": []
 *               }
 *            }
 *        ]
 *     },
 *    "async": false,
 *    "expression": false
 *    },
 *    "kind": "init"
 * }
 * 5. { theKey: function () { return theThing() } }  // AST-тип: FunctionExpression с BlockStatement
 * {
 *    "type": "Property",
 *    "key": { "type": "Identifier", "name": "theKey" },
 *    "value": {
 *      "type": "FunctionExpression",
 *      "params": [],
 *      "body": {
 *        "type": "BlockStatement",
 *        "body": [
 *            {
 *               "type": "ReturnStatement",
 *               "argument": {
 *                  "type": "CallExpression",
 *                  "callee": { "type": "Identifier", "name": "theThing" },
 *                  "arguments": []
 *               }
 *            }
 *        ]
 *     },
 *    "id": null
 *   },
 *   "kind": "init"
 * }
 */
export function parse_UseState(path: NodePath<t.VariableDeclarator>) {
  const node = path.node;
  const id = node.id;
  // Проверяем, что это идентификатор useStore
  if (!t.isIdentifier(id) || id.name !== 'useStore') {
    return;
  }
  // Проверяем, что правая часть - ObjectExpression
  const init = node.init;
  if (!t.isObjectExpression(init)) {
    console.log("Правая часть не является ObjectExpression");
    return;
  }

  // Список зависимостей
  const dependencies: Record<string, any> = {};

  // ObjectExpressionState: Проходим по свойствам объекта
  init.properties.forEach((prop) => {
    if (!t.isProperty(prop)) {
      return;
    }

    const key = prop.key;
    const value = prop.value;

    // Проверка ключа (Identifier)
    if (!t.isIdentifier(key)) {
      return;
    }
    const keyName = key.name;

    // Переход в IdentifierState
    if (t.isIdentifier(value)) {
      dependencies[keyName] = value.name;
    }
    // Переход в CallExpressionState
    else if (t.isCallExpression(value)) {
      if (t.isIdentifier(value.callee)) {
        dependencies[keyName] = value.callee.name;
      }
    }
    // Переход в ArrowFunctionState
    else if (t.isArrowFunctionExpression(value)) {
      if (t.isCallExpression(value.body)) {
        // Сокращенная форма: () => theThing()
        if (t.isIdentifier(value.body.callee)) {
          dependencies[keyName] = value.body.callee.name;
        }
      } else if (t.isBlockStatement(value.body)) {
        // Переход в BlockStatementState: () => { return theThing(); }
        value.body.body.forEach((statement) => {
          if (t.isReturnStatement(statement) && t.isCallExpression(statement.argument)) {
            if (t.isIdentifier(statement.argument.callee)) {
              dependencies[keyName] = statement.argument.callee.name;
            }
          }
        });
      }
    }
    // Переход в FunctionExpressionState
    else if (t.isFunctionExpression(value)) {
      // Переход в BlockStatementState
      value.body.body.forEach((statement) => {
        if (t.isReturnStatement(statement) && t.isCallExpression(statement.argument)) {
          if (t.isIdentifier(statement.argument.callee)) {
            dependencies[keyName] = statement.argument.callee.name;
          }
        }
      });
    }
  });

  return dependencies;
}