function exportedType(program, path, name) {
  const checker = program.getTypeChecker();
  const source = program.getSourceFiles().find(file => file.fileName.replace(/\\/gu, "/").endsWith(`/${path}`));
  const module = source === undefined ? undefined : checker.getSymbolAtLocation(source);
  const symbol = module === undefined ? undefined : checker.getExportsOfModule(module).find(entry => entry.getName() === name);

  if (symbol === undefined) {
    throw new Error(`could not find ${name} in ${path}`);
  }
  return checker.getDeclaredTypeOfSymbol(symbol);
}

export function createForbiddenTypeRule({ description, messageId, message, types, selector, nodeOf }) {
  return {
    meta: { type: "problem", docs: { description }, schema: [], messages: { [messageId]: message } },
    create(context) {
      const services = context.sourceCode.parserServices;

      if (services?.program === undefined || services.program === null) {
        throw new Error(`${description} requires type information`);
      }
      const forbidden = new Set(types.map(([path, name]) => exportedType(services.program, path, name)));

      return {
        [selector](node) {
          if (forbidden.has(services.getTypeAtLocation(nodeOf(node)))) {
            context.report({ node: nodeOf(node), messageId });
          }
        }
      };
    }
  };
}
