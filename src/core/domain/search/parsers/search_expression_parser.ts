import { parseExactSearchTerm, parseSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { removeExtraWhitespace } from "@/core/utils/string/string_utilities";

const OPEN = "(";
const NEGATED_OPEN = "-(";
const CLOSE = ")";
const OR = "~";

export function tryParseSearchExpression(query: string): SearchExpression | undefined {
  try {
    return parseSearchExpression(query);
  } catch {
    return undefined;
  }
}

export function parseSearchExpression(query: string): SearchExpression {
  const tokens = tokenize(normalize(query));
  return new Parser(tokens).parseTopLevel();
}

export function parseExclusions(tags: readonly string[]): SearchExpression | undefined {
  const exclusionSearchExpressions = tags.map(tag => SearchExpression.not(SearchExpression.term(parseExactSearchTerm(tag.toLowerCase()))));
  return exclusionSearchExpressions.length === 0 ? undefined : SearchExpression.and(exclusionSearchExpressions);
}

function normalize(query: string): string {
  return removeExtraWhitespace(query).toLowerCase();
}

function tokenize(query: string): string[] {
  return query === "" ? [] : query.split(" ");
}

class Parser {
  private cursor = 0;

  constructor(private readonly tokens: string[]) { }

  public parseTopLevel(): SearchExpression {
    const memberSearchExpressions: SearchExpression[] = [];

    while (!this.atEnd()) {
      const token = this.peek();

      if (token === OR) {
        throw new Error(`'~' outside a group at token ${this.cursor + 1}`);
      }

      if (token === CLOSE) {
        throw new Error(`unmatched ')' at token ${this.cursor + 1}`);
      }
      memberSearchExpressions.push(this.parseMember());
    }
    return SearchExpression.and(memberSearchExpressions);
  }

  private parseMember(): SearchExpression {
    return this.peek() === OPEN || this.peek() === NEGATED_OPEN ? this.parseGroup() : this.parseTerm();
  }

  private parseGroup(): SearchExpression {
    const openAt = this.cursor + 1;
    const isNegated = this.advance() === NEGATED_OPEN;
    const memberSearchExpressions: SearchExpression[] = [this.parseGroupMember(openAt)];
    let separator: string | null = null;

    while (!this.atEnd() && this.peek() !== CLOSE) {
      separator = this.readSeparator(separator, openAt);
      memberSearchExpressions.push(this.parseGroupMember(openAt));
    }

    if (this.atEnd()) {
      throw new Error(`unclosed '(' at token ${openAt}`);
    }
    this.advance();
    const groupSearchExpression = separator === OR ? SearchExpression.or(memberSearchExpressions) : SearchExpression.and(memberSearchExpressions);
    return isNegated ? SearchExpression.not(groupSearchExpression) : groupSearchExpression;
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
