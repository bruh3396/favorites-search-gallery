type Alternative = string[];

export function desugarNestedOrGroups(query: string): string {
  const tokens = query.split(" ");
  const output: string[] = [];
  let cursor = 0;

  while (cursor < tokens.length) {
    if (tokens[cursor] === "(") {
      const group = readGroup(tokens, cursor);

      if (group !== null) {
        output.push(flattenGroup(group.alternatives));
        cursor = group.next;
        continue;
      }
    }
    output.push(tokens[cursor]);
    cursor += 1;
  }
  return output.join(" ");
}

function readGroup(tokens: string[], start: number): { alternatives: Alternative[]; next: number } | null {
  const alternatives: Alternative[] = [];
  let cursor = start + 1;
  let isExpectingAlternative = true;

  while (cursor < tokens.length) {
    const token = tokens[cursor];

    if (token === ")") {
      return isExpectingAlternative || alternatives.length === 0 ? null : { alternatives, next: cursor + 1 };
    }

    if (isExpectingAlternative) {
      const alternative = readAlternative(tokens, cursor);

      if (alternative === null) {
        return null;
      }
      alternatives.push(alternative.terms);
      cursor = alternative.next;
      isExpectingAlternative = false;
      continue;
    }

    if (token !== "~") {
      return null;
    }
    cursor += 1;
    isExpectingAlternative = true;
  }
  return null;
}

function readAlternative(tokens: string[], start: number): { terms: string[]; next: number } | null {
  if (tokens[start] !== "(") {
    return isDelimiter(tokens[start]) ? null : { terms: [tokens[start]], next: start + 1 };
  }
  const terms: string[] = [];
  let cursor = start + 1;

  while (cursor < tokens.length) {
    const token = tokens[cursor];

    if (token === ")") {
      return terms.length === 0 ? null : { terms, next: cursor + 1 };
    }

    if (isDelimiter(token)) {
      return null;
    }
    terms.push(token);
    cursor += 1;
  }
  return null;
}

function flattenGroup(alternatives: Alternative[]): string {
  if (alternatives.every(alternative => alternative.length === 1)) {
    return `( ${alternatives.map(alternative => alternative[0]).join(" ~ ")} )`;
  }
  return cartesianProduct(alternatives).map(clause => `( ${clause.join(" ~ ")} )`).join(" ");
}

function cartesianProduct(alternatives: Alternative[]): string[][] {
  return alternatives.reduce<string[][]>(
    (clauses, alternative) => clauses.flatMap(clause => alternative.map(term => [...clause, term])),
    [[]]
  );
}

function isDelimiter(token: string): boolean {
  return token === "(" || token === ")" || token === "~";
}
