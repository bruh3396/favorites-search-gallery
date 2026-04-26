/* eslint-disable max-classes-per-file */
import { Searchable, SearchableMetadataMetric } from "../types/common_types";
import { describe, test } from "vitest";
import { ExactSearchTag } from "../lib/search/tag/exact_search_tag";
import { Favorite } from "../types/favorite_data_types";
import { MetadataSearchExpression } from "../lib/search/types/metadata_search_expression";
import { MetadataSearchTag } from "../lib/search/tag/metadata_search_tag";

function benchmark(label: string, fn: () => void): void {
  const start = performance.now();

  fn();

  const end = performance.now();

  // eslint-disable-next-line no-console
  console.info(`${label}: ${end - start}ms`);
}

describe.skip("MetadataSearchTag benchmark", () => {
  type MetadataSearchable = Searchable & { metrics: Record<SearchableMetadataMetric, number> };

  class MetadataSearchTagSimple extends ExactSearchTag {
    private expression: MetadataSearchExpression;

    constructor(value: string, negated: boolean, expression: MetadataSearchExpression) {
      super(value, negated);
      this.expression = expression;
    }

    protected override matchesPositive(item: Favorite): boolean {
      const left = item.metrics[this.expression.metric];
      const right = this.expression.hasRightHandMetric ? item.metrics[this.expression.rightHandMetric] : this.expression.rightHandValue;

      switch (this.expression.operator) {
        case ":": return left === right;

        case ":<": return left < right;

        case ":>": return left > right;

        default: return false;
      }
    }

    protected override matchesNegated(item: Favorite): boolean {
      return !this.matchesPositive(item);
    }
  }

  class MetadataSearchTagBasicNegation extends ExactSearchTag {
    private compare: (a: number, b: number) => boolean;
    private getRightValue: (item: Favorite) => number;
    private getLeftValue: (item: Favorite) => number;

    constructor(value: string, negated: boolean, expression: MetadataSearchExpression) {
      super(value, negated);
      this.compare = expression.operator === ":" ? (a, b): boolean => a === b : expression.operator === ":<" ? (a, b): boolean => a < b : expression.operator === ":>" ? (a, b): boolean => a > b : (): boolean => false;
      this.getLeftValue = (item): number => item.metrics[expression.metric];
      this.getRightValue = expression.hasRightHandMetric ? (item): number => item.metrics[expression.rightHandMetric] : (): number => expression.rightHandValue;
    }

    protected override matchesPositive(item: Favorite): boolean {
      return this.compare(this.getLeftValue(item), this.getRightValue(item));
    }

    protected override matchesNegated(item: Favorite): boolean {
      return !this.matchesPositive(item);
    }
  }

  class SearchTagBranch {
    public readonly value: string;
    public readonly negated: boolean;

    constructor(value: string, negated: boolean) {
      this.value = value;
      this.negated = negated;
    }

    public get finalCost(): number {
      return this.negated ? this.cost + 1 : this.cost;
    }

    protected get cost(): number {
      return 0;
    }

    public matches(item: Searchable): boolean {
      return this.negated ? !this.matchesPositive(item) : this.matchesPositive(item);
    }

    protected matchesPositive(item: Searchable): boolean {
      return item.tags.has(this.value);
    }
  }

  function createMetadataSearchable(metrics: Partial<Record<SearchableMetadataMetric, number>>): MetadataSearchable {
    return {
      tags: new Set(),
      metrics: { score: 0, width: 0, height: 0, id: 0, duration: 0, ...metrics }
    };
  }

  const HD = createMetadataSearchable({ width: 1920, height: 1080, score: 50, id: 1000, duration: 120 });
  const ITERATIONS = 100_000_000;

  test("MetadataSearchTag benchmark", () => {
    const value = "score:<25";
    const negated = true;
    const expression = new MetadataSearchExpression(value);
    const dynamic = new MetadataSearchTag(value, negated, expression);
    const simple = new MetadataSearchTagSimple(value, negated, expression);
    const basic = new MetadataSearchTagBasicNegation(value, negated, expression);

    benchmark("Simple", () => {

      for (let i = 0; i < ITERATIONS; i += 1) {
        simple.matches(HD);
      }
    });

    benchmark("Dynamic", () => {
      for (let i = 0; i < ITERATIONS; i += 1) {
        dynamic.matches(HD);
      }
    });

    benchmark("BasicNegation", () => {
      for (let i = 0; i < ITERATIONS; i += 1) {
        basic.matches(HD);
      }
    });
  });

  test("SearchTag vs SearchTagBranch (negation dispatch vs branch check)", () => {
    const tagValue = "score";
    const negated = true;
    const dynamic = new ExactSearchTag(tagValue, negated);
    const branch = new SearchTagBranch(tagValue, negated);

    benchmark("SearchTag (pre bound)", () => {
      for (let i = 0; i < ITERATIONS; i += 1) {
        dynamic.matches(HD);
      }
    });

    benchmark("SearchTagBranch (branching)", () => {
      for (let i = 0; i < ITERATIONS; i += 1) {
        branch.matches(HD);
      }
    });
  });
});
