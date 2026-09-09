import { FruitName, allDocNames, allTerms, fruitDocs } from "@/lib/search/testing/fruit_corpus";
import { Metric, Searchable } from "@/types/search";

export type AssertMatches = (query: string, expectedNames: FruitName[]) => void;

export const searchCases: { name: string; run: (assert: AssertMatches) => void }[] = [
  {
    name: "empty",
    run: (assert: AssertMatches): void => {
      assert("", allDocNames);
      assert(" ", allDocNames);
      assert(" \n\t", allDocNames);
    }
  },
  {
    name: "all",
    run: (assert: AssertMatches): void => {
      assert("*", allDocNames);
      assert("**", allDocNames);
      assert("* ** *** **** *****", allDocNames);
    }
  },
  {
    name: "names",
    run: (assert: AssertMatches): void => {
      for (const item of fruitDocs) {
        assert(item.name, [item.name]);
      }
    }
  },
  {
    name: "and",
    run: (assert: AssertMatches): void => {
      assert("low-fat_(dairy)", ["apple"]);
      assert("red", ["apple", "cherry", "strawberry"]);
      assert("red sweet", ["cherry", "strawberry"]);
      assert("red -sweet", ["apple"]);
      assert("red apple", ["apple"]);
      assert("red banana", []);
      assert("berry", ["blueberry", "strawberry"]);
      assert("antioxidants", ["apple", "cherry", "grape", "strawberry"]);
      assert("antioxidant", ["blueberry"]);
      assert("antioxidants -antioxidant", ["apple", "cherry", "grape", "strawberry"]);
      assert("vitamin-c", ["kiwi", "orange", "pear", "strawberry"]);
      assert("juicy fiber -citrus", ["mango", "pear"]);
      assert("sweet -berry", ["cherry", "grape", "mango", "pear"]);
      assert("tropical -mango", ["kiwi"]);
    }
  },
  {
    name: "or",
    run: (assert: AssertMatches): void => {
      assert("( red ~ blue )", ["apple", "cherry", "strawberry", "blueberry"]);
      assert("( red ~ blue ) ( apple ~ cherry )", ["apple", "cherry"]);
      assert("( berry ~ tart )", ["blueberry", "cherry", "kiwi", "strawberry"]);
      assert("( vitamin-c ~ antioxidants ) sweet", ["cherry", "grape", "pear", "strawberry"]);
      assert("( red ~ green ) -snack", ["banana", "kiwi", "pear", "strawberry"]);
      assert("( tart ~ tropical ) ( fiber ~ smoothie )", ["cherry", "kiwi", "mango"]);
    }
  },
  {
    name: "negated or",
    run: (assert: AssertMatches): void => {
      assert("( red ~ -red )", allDocNames);
      assert("( red ~ -sweet )", ["apple", "banana", "cherry", "kiwi", "orange", "strawberry"]);
      assert("( -red ~ -sweet )", ["apple", "banana", "blueberry", "grape", "kiwi", "mango", "orange", "pear"]);
      assert("( red ~ -berry )", ["apple", "banana", "cherry", "grape", "kiwi", "mango", "orange", "pear", "strawberry"]);
      assert("( -* ~ red )", ["apple", "cherry", "strawberry"]);
      assert("fiber ( sweet ~ -red )", ["banana", "blueberry", "cherry", "kiwi", "mango", "orange", "pear"]);
    }
  },
  {
    name: "nested or",
    run: (assert: AssertMatches): void => {
      assert("( red ~ ( sweet berry ) )", ["apple", "cherry", "strawberry", "blueberry"]);
      assert("( ( sweet berry ) ~ red )", ["apple", "cherry", "strawberry", "blueberry"]);
      assert("( apple ~ ( green tropical ) )", ["apple", "kiwi"]);
      assert("( ( juicy citrus ) ~ ( grainy soft ) )", ["orange", "pear"]);
      assert("green ( red ~ ( fiber tart ) )", ["apple", "kiwi"]);
    }
  },
  {
    name: "wildcard",
    run: (assert: AssertMatches): void => {
      assert("ch*", ["cherry"]);
      assert("r*", ["apple", "cherry", "strawberry"]);
      assert("*ch", ["pear"]);
      assert("-*ch -ch* *ch*", ["apple"]);
      assert("*ch*", ["apple", "cherry", "pear"]);
      assert("berr*", ["blueberry", "strawberry"]);
      assert("*berry", ["blueberry", "strawberry"]);
      assert("*erry*", ["blueberry", "cherry", "strawberry"]);
      assert("vitamin-*", ["kiwi", "mango", "orange", "pear", "strawberry"]);
      assert("*c", ["kiwi", "orange", "pear", "strawberry"]);
      assert("*vita*", ["kiwi", "mango", "orange", "pear", "strawberry"]);
    }
  },
  {
    name: "mixed",
    run: (assert: AssertMatches): void => {
      assert("( red ~ blue ) sweet", ["cherry", "strawberry", "blueberry"]);
      assert("( red ~ blue ) -*we*t", ["apple"]);
      assert("( red ~ blue ) ( apple ~ ch*y )", ["apple", "cherry"]);
      assert("( red ~ blue ) ( a* ~ cherry ) -sweet", ["apple"]);
      assert("( r* ~ blue ) ( apple ~ cherry ) -sweet -red", []);
      assert("*berry* sweet", ["blueberry", "strawberry"]);
      assert("sweet -*berry", ["cherry", "grape", "mango", "pear"]);
      assert("( s* ~ vitamin-* ) -sweet", ["apple", "banana", "kiwi", "orange"]);
      assert("fiber sweet -*berry -green", ["cherry", "mango"]);
      assert("small -*berry -green", ["cherry"]);
    }
  },
  {
    name: "invalid",
    run: (assert: AssertMatches): void => {
      assert("( ~ )", []);
      assert("( )", []);
      assert("()", []);
      assert("(", []);
      assert(")", []);
      assert("-", []);
      assert(")-", []);
      assert(")) apple", []);
      assert(")) *", []);
      assert("(apple )", []);
      assert("( apple)", []);
      assert("( apple ~banana )", []);
      assert("( apple~banana )", []);
      assert("( apple~ banana )", []);
      assert("( apple ~ banana)", []);
      assert("apple )", []);
      assert("apple (", []);
    }
  },
  {
    name: "all tags",
    run: (assert: AssertMatches): void => {
      const orAllQuery = `( ${Array.from(allTerms).join(" ~ ")} )`;
      const andAllQuery = `${Array.from(allTerms).join(" ")}`;

      assert(orAllQuery, allDocNames);
      assert(andAllQuery, []);

      for (const tag of allTerms) {
        assert(tag, fruitDocs.filter(item => item.tags.has(tag)).map(item => item.name));
        assert(`-${tag}`, fruitDocs.filter(item => !item.tags.has(tag)).map(item => item.name));
      }
    }
  },
  {
    name: "logical",
    run: (assert: AssertMatches): void => {
      assert("red -red", []);
      assert("red -r*", []);
      assert("red -*", []);
      assert("red -*red*", []);
      assert("red -red*", []);
      assert("red -*red", []);
    }
  },
  {
    name: "wildcard edge cases",
    run: (assert: AssertMatches): void => {
      assert("zzz*", []);
      assert("*zzz*", []);
      assert("*zzz", []);
      assert("*z*z*", ["kiwi"]);
      assert("( zzz* ~ red )", ["apple", "cherry", "strawberry"]);
      assert("( zzz* ~ zzy* )", []);
      assert("*ow*fat*", ["apple"]);
      assert("*ita*a", ["mango"]);
      assert("*ita*c", ["kiwi", "orange", "pear", "strawberry"]);
      assert("-*ita*c", ["apple", "banana", "blueberry", "cherry", "grape", "mango"]);
      assert("*vitamin-*", ["kiwi", "mango", "orange", "pear", "strawberry"]);
      assert("( *ita*a ~ *ita*c )", ["kiwi", "mango", "orange", "pear", "strawberry"]);
      assert("( *fat* ~ vitamin* )", ["apple", "kiwi", "mango", "orange", "pear", "strawberry"]);
      assert("( *fat* ~ red )", ["apple", "cherry", "strawberry"]);
    }
  }
];

export type MetricDoc = Searchable & {
  name: string;
  metrics: Partial<Record<Metric, number>>;
  getMetric: (metric: Metric) => number;
};

function metricDoc(name: string, tags: string[], metrics: Partial<Record<Metric, number>>): MetricDoc {
  return {
    name,
    tags: new Set(tags),
    metrics,
    getMetric(metric: Metric): number {
      return this.metrics[metric] ?? 0;
    }
  };
}

export const metricDocs: MetricDoc[] = [
  metricDoc("apple", ["red"], { score: 10, width: 400, height: 100 }),
  metricDoc("banana", ["yellow"], { score: 20, width: 100, height: 400 }),
  metricDoc("cherry", ["red"], { score: 30, width: 200, height: 200 }),
  metricDoc("grape", ["purple"], { score: 30, width: 300, height: 150 }),
  metricDoc("kiwi", ["green"], { score: 5, width: 150, height: 300 })
];

export type AssertMetricMatches = (query: string, expectedNames: string[]) => void;

export const metricSearchCases: { name: string; run: (assert: AssertMetricMatches) => void }[] = [
  {
    name: "absolute comparison",
    run: (assert: AssertMetricMatches): void => {
      assert("score:>15", ["banana", "cherry", "grape"]);
      assert("score:<15", ["apple", "kiwi"]);
      assert("score:30", ["cherry", "grape"]);
      assert("score:>1000", []);
    }
  },
  {
    name: "negated absolute comparison",
    run: (assert: AssertMetricMatches): void => {
      assert("-score:>15", ["apple", "kiwi"]);
      assert("-score:30", ["apple", "banana", "kiwi"]);
    }
  },
  {
    name: "absolute comparison with a tag",
    run: (assert: AssertMetricMatches): void => {
      assert("red score:>15", ["cherry"]);
      assert("red -score:<15", ["cherry"]);
    }
  },
  {
    name: "absolute comparison inside an or group",
    run: (assert: AssertMetricMatches): void => {
      assert("( score:>25 ~ yellow )", ["banana", "cherry", "grape"]);
      assert("( score:>1000 ~ red )", ["apple", "cherry"]);
    }
  },
  {
    name: "two absolute comparisons",
    run: (assert: AssertMetricMatches): void => {
      assert("score:>15 score:<30", ["banana"]);
    }
  },
  {
    name: "relative comparison",
    run: (assert: AssertMetricMatches): void => {
      assert("width:>height", ["apple", "grape"]);
      assert("width:<height", ["banana", "kiwi"]);
    }
  },
  {
    name: "negated relative comparison",
    run: (assert: AssertMetricMatches): void => {
      assert("-width:>height", ["banana", "cherry", "kiwi"]);
    }
  },
  {
    name: "relative comparison with a tag",
    run: (assert: AssertMetricMatches): void => {
      assert("red width:>height", ["apple"]);
    }
  },
  {
    name: "relative comparison inside an or group",
    run: (assert: AssertMetricMatches): void => {
      assert("( width:>height ~ yellow )", ["apple", "banana", "grape"]);
    }
  },
  {
    name: "a metric compared to itself",
    run: (assert: AssertMetricMatches): void => {
      assert("width:width", ["apple", "banana", "cherry", "grape", "kiwi"]);
      assert("width:>width", []);
      assert("width:<width", []);
    }
  },
  {
    name: "a negated metric compared to itself",
    run: (assert: AssertMetricMatches): void => {
      assert("-width:width", []);
      assert("-width:>width", ["apple", "banana", "cherry", "grape", "kiwi"]);
    }
  }
];
