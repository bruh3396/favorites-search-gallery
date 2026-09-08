import { SearchExpression } from "@/lib/search/engine/bitmap/query/expression";
import { parseSearchTerm } from "@/lib/search/query/parsers/search_term_parser";
import { removeExtraWhitespace } from "@/utils/pure/string";

const OPEN = "(";
const CLOSE = ")";
const OR = "~";

export function parseSearchExpression(query: string): SearchExpression {
  const tokens = tokenize(query);
  const parser = new Parser(tokens);
  const expression = parser.parseTopLevel();

  parser.expectEnd();
  return expression;
}

export function tryParseSearchExpression(query: string): SearchExpression | undefined {
  try {
    return parseSearchExpression(query);
  } catch {
    return undefined;
  }
}

function tokenize(query: string): string[] {
  const normalized = removeExtraWhitespace(query).toLowerCase();
  return normalized === "" ? [] : normalized.split(" ");
}

class Parser {
  private cursor = 0;

  constructor(private readonly tokens: string[]) { }

  public parseTopLevel(): SearchExpression {
    const members: SearchExpression[] = [];

    while (!this.atEnd()) {
      const token = this.peek();

      if (token === OR) {
        throw new Error(`'~' outside a group at token ${this.cursor + 1}`);
      }

      if (token === CLOSE) {
        throw new Error(`unmatched ')' at token ${this.cursor + 1}`);
      }
      members.push(this.parseMember());
    }
    return SearchExpression.and(members);
  }

  public expectEnd(): void {
    if (!this.atEnd()) {
      throw new Error(`unexpected token '${this.peek()}' at token ${this.cursor + 1}`);
    }
  }

  private parseMember(): SearchExpression {
    return this.peek() === OPEN ? this.parseGroup() : this.parseTerm();
  }

  private parseGroup(): SearchExpression {
    const openAt = this.cursor + 1;

    this.advance();
    const members: SearchExpression[] = [this.parseGroupMember(openAt)];
    let separator: string | null = null;

    while (!this.atEnd() && this.peek() !== CLOSE) {
      separator = this.readSeparator(separator, openAt);
      members.push(this.parseGroupMember(openAt));
    }

    if (this.atEnd()) {
      throw new Error(`unclosed '(' at token ${openAt}`);
    }
    this.advance();
    return separator === OR ? SearchExpression.or(members) : SearchExpression.and(members);
  }

  private readSeparator(current: string | null, openAt: number): string {
    if (this.peek() === OR) {
      this.advance();

      if (current === "and") {
        throw new Error(`mixed '~' and AND in one group opened at token ${openAt}`);
      }
      return OR;
    }

    if (current === OR) {
      throw new Error(`mixed '~' and AND in one group opened at token ${openAt}`);
    }
    return "and";
  }

  private parseGroupMember(openAt: number): SearchExpression {
    if (this.atEnd()) {
      throw new Error(`unclosed '(' at token ${openAt}`);
    }
    const token = this.peek();

    if (token === CLOSE) {
      throw new Error(`empty group at token ${this.cursor + 1}`);
    }

    if (token === OR) {
      throw new Error(`'~' with no left-hand alternative at token ${this.cursor + 1}`);
    }
    return this.parseMember();
  }

  private parseTerm(): SearchExpression {
    return SearchExpression.term(parseSearchTerm(this.advance()));
  }

  private peek(): string {
    return this.tokens[this.cursor];
  }

  private advance(): string {
    const token = this.tokens[this.cursor];

    this.cursor += 1;
    return token;
  }

  private atEnd(): boolean {
    return this.cursor >= this.tokens.length;
  }
}
