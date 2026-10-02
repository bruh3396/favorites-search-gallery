const DOM_ROOTS = new Set(["Node", "Event", "Window"]);

function isDomLibrary(symbol) {
  return (symbol?.getDeclarations() ?? []).some(declaration => /lib\.dom\.d\.ts$/u.test(declaration.getSourceFile().fileName));
}

function inheritsDomRoot(checker, type, seen) {
  if (seen.has(type)) {
    return false;
  }
  seen.add(type);

  if (DOM_ROOTS.has(type.getSymbol()?.getName()) && isDomLibrary(type.getSymbol())) {
    return true;
  }
  return type.isClassOrInterface() && (checker.getBaseTypes(type) ?? []).some(base => inheritsDomRoot(checker, base, seen));
}

function isDomType(checker, type) {
  if (type.isUnionOrIntersection()) {
    return type.types.some(member => isDomType(checker, member));
  }

  if (checker.isArrayType(type)) {
    return checker.getTypeArguments(type).some(element => isDomType(checker, element));
  }
  return inheritsDomRoot(checker, type, new Set());
}

export const noDomTypes = {
  meta: {
    type: "problem",
    docs: { description: "model/ never handles DOM nodes or events" },
    schema: [],
    messages: {
      rule34: "rule 34: model/ never handles DOM nodes or events; have the view or control extract the data it needs"
    }
  },
  create(context) {
    const services = context.sourceCode.parserServices;

    if (services?.program === undefined || services.program === null) {
      throw new Error("architecture/no-dom-types requires type information");
    }
    const checker = services.program.getTypeChecker();
    const verdicts = new Map();

    return {
      Identifier(node) {
        const type = services.getTypeAtLocation(node);

        if (!verdicts.has(type)) {
          verdicts.set(type, isDomType(checker, type));
        }

        if (verdicts.get(type)) {
          context.report({ node, messageId: "rule34" });
        }
      }
    };
  }
};
