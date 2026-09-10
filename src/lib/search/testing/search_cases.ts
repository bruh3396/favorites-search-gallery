import { FruitName, allDocNames, allTerms, fruitDocs } from "@/lib/search/testing/fruit_corpus";
import { MetricSearchable } from "@/types/search";

export type QueryAssertion = (query: string, expectedNames: FruitName[]) => void;
export type MetricDoc = MetricSearchable & { name: string };
export type SearchCase = { query: string; expected: FruitName[] };
export type SearchCaseGroup = { name: string; cases?: SearchCase[]; run?: (assert: QueryAssertion) => void };

export const searchCases: SearchCaseGroup[] = [
  {
    name: "empty",
    cases: [
      { query: "", expected: allDocNames },
      { query: " ", expected: allDocNames },
      { query: " \n\t", expected: allDocNames }
    ]
  },
  {
    name: "all",
    cases: [
      { query: "*", expected: allDocNames },
      { query: "**", expected: allDocNames },
      { query: "* ** *** **** *****", expected: allDocNames }
    ]
  },
  {
    name: "names",
    run: (assert: QueryAssertion): void => {
      for (const item of fruitDocs) {
        assert(item.name, [item.name]);
      }
    }
  },
  {
    name: "and",
    cases: [
      { query: "low-fat_(dairy)", expected: ["apple"] },
      { query: "red", expected: ["apple", "cherry", "strawberry"] },
      { query: "red sweet", expected: ["cherry", "strawberry"] },
      { query: "red -sweet", expected: ["apple"] },
      { query: "red apple", expected: ["apple"] },
      { query: "red banana", expected: [] },
      { query: "berry", expected: ["blueberry", "strawberry"] },
      { query: "antioxidants", expected: ["apple", "cherry", "grape", "strawberry"] },
      { query: "antioxidant", expected: ["blueberry"] },
      { query: "antioxidants -antioxidant", expected: ["apple", "cherry", "grape", "strawberry"] },
      { query: "vitamin-c", expected: ["kiwi", "orange", "pear", "strawberry"] },
      { query: "juicy fiber -citrus", expected: ["mango", "pear"] },
      { query: "sweet -berry", expected: ["cherry", "grape", "mango", "pear"] },
      { query: "tropical -mango", expected: ["kiwi"] }
    ]
  },
  {
    name: "or",
    cases: [
      { query: "( red ~ blue )", expected: ["apple", "cherry", "strawberry", "blueberry"] },
      { query: "( red ~ blue ) ( apple ~ cherry )", expected: ["apple", "cherry"] },
      { query: "( berry ~ tart )", expected: ["blueberry", "cherry", "kiwi", "strawberry"] },
      { query: "( vitamin-c ~ antioxidants ) sweet", expected: ["cherry", "grape", "pear", "strawberry"] },
      { query: "( red ~ green ) -snack", expected: ["banana", "kiwi", "pear", "strawberry"] },
      { query: "( tart ~ tropical ) ( fiber ~ smoothie )", expected: ["cherry", "kiwi", "mango"] }
    ]
  },
  {
    name: "negated or",
    cases: [
      { query: "( red ~ -red )", expected: allDocNames },
      { query: "( red ~ -sweet )", expected: ["apple", "banana", "cherry", "kiwi", "orange", "strawberry"] },
      { query: "( -red ~ -sweet )", expected: ["apple", "banana", "blueberry", "grape", "kiwi", "mango", "orange", "pear"] },
      { query: "( red ~ -berry )", expected: ["apple", "banana", "cherry", "grape", "kiwi", "mango", "orange", "pear", "strawberry"] },
      { query: "( -* ~ red )", expected: ["apple", "cherry", "strawberry"] },
      { query: "fiber ( sweet ~ -red )", expected: ["banana", "blueberry", "cherry", "kiwi", "mango", "orange", "pear"] }
    ]
  },
  {
    name: "nested or",
    cases: [
      { query: "( red ~ ( sweet berry ) )", expected: ["apple", "cherry", "strawberry", "blueberry"] },
      { query: "( ( sweet berry ) ~ red )", expected: ["apple", "cherry", "strawberry", "blueberry"] },
      { query: "( apple ~ ( green tropical ) )", expected: ["apple", "kiwi"] },
      { query: "( ( juicy citrus ) ~ ( grainy soft ) )", expected: ["orange", "pear"] },
      { query: "green ( red ~ ( fiber tart ) )", expected: ["apple", "kiwi"] }
    ]
  },
  {
    name: "wildcard",
    cases: [
      { query: "ch*", expected: ["cherry"] },
      { query: "r*", expected: ["apple", "cherry", "strawberry"] },
      { query: "*ch", expected: ["pear"] },
      { query: "-*ch -ch* *ch*", expected: ["apple"] },
      { query: "*ch*", expected: ["apple", "cherry", "pear"] },
      { query: "berr*", expected: ["blueberry", "strawberry"] },
      { query: "*berry", expected: ["blueberry", "strawberry"] },
      { query: "*erry*", expected: ["blueberry", "cherry", "strawberry"] },
      { query: "vitamin-*", expected: ["kiwi", "mango", "orange", "pear", "strawberry"] },
      { query: "*c", expected: ["kiwi", "orange", "pear", "strawberry"] },
      { query: "*vita*", expected: ["kiwi", "mango", "orange", "pear", "strawberry"] }
    ]
  },
  {
    name: "mixed",
    cases: [
      { query: "( red ~ blue ) sweet", expected: ["cherry", "strawberry", "blueberry"] },
      { query: "( red ~ blue ) -*we*t", expected: ["apple"] },
      { query: "( red ~ blue ) ( apple ~ ch*y )", expected: ["apple", "cherry"] },
      { query: "( red ~ blue ) ( a* ~ cherry ) -sweet", expected: ["apple"] },
      { query: "( r* ~ blue ) ( apple ~ cherry ) -sweet -red", expected: [] },
      { query: "*berry* sweet", expected: ["blueberry", "strawberry"] },
      { query: "sweet -*berry", expected: ["cherry", "grape", "mango", "pear"] },
      { query: "( s* ~ vitamin-* ) -sweet", expected: ["apple", "banana", "kiwi", "orange"] },
      { query: "fiber sweet -*berry -green", expected: ["cherry", "mango"] },
      { query: "small -*berry -green", expected: ["cherry"] }
    ]
  },
  {
    name: "invalid",
    cases: [
      { query: "( ~ )", expected: [] },
      { query: "( )", expected: [] },
      { query: "()", expected: [] },
      { query: "(", expected: [] },
      { query: ")", expected: [] },
      { query: "-", expected: [] },
      { query: ")-", expected: [] },
      { query: ")) apple", expected: [] },
      { query: ")) *", expected: [] },
      { query: "(apple )", expected: [] },
      { query: "( apple)", expected: [] },
      { query: "( apple ~banana )", expected: [] },
      { query: "( apple~banana )", expected: [] },
      { query: "( apple~ banana )", expected: [] },
      { query: "( apple ~ banana)", expected: [] },
      { query: "apple )", expected: [] },
      { query: "apple (", expected: [] }
    ]
  },
  {
    name: "all tags",
    run: (assert: QueryAssertion): void => {
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
    name: "contradiction",
    cases: [
      { query: "red -red", expected: [] },
      { query: "red -r*", expected: [] },
      { query: "red -*", expected: [] },
      { query: "red -*red*", expected: [] },
      { query: "red -red*", expected: [] },
      { query: "red -*red", expected: [] }
    ]
  },
  {
    name: "wildcard edge cases",
    cases: [
      { query: "zzz*", expected: [] },
      { query: "*zzz*", expected: [] },
      { query: "*zzz", expected: [] },
      { query: "*z*z*", expected: ["kiwi"] },
      { query: "( zzz* ~ red )", expected: ["apple", "cherry", "strawberry"] },
      { query: "( zzz* ~ zzy* )", expected: [] },
      { query: "*ow*fat*", expected: ["apple"] },
      { query: "*ita*a", expected: ["mango"] },
      { query: "*ita*c", expected: ["kiwi", "orange", "pear", "strawberry"] },
      { query: "-*ita*c", expected: ["apple", "banana", "blueberry", "cherry", "grape", "mango"] },
      { query: "*vitamin-*", expected: ["kiwi", "mango", "orange", "pear", "strawberry"] },
      { query: "( *ita*a ~ *ita*c )", expected: ["kiwi", "mango", "orange", "pear", "strawberry"] },
      { query: "( *fat* ~ vitamin* )", expected: ["apple", "kiwi", "mango", "orange", "pear", "strawberry"] },
      { query: "( *fat* ~ red )", expected: ["apple", "cherry", "strawberry"] }
    ]
  },
  {
    name: "metric absolute comparison",
    cases: [
      { query: "score:>15", expected: ["banana", "cherry", "grape", "mango", "orange", "pear", "strawberry"] },
      { query: "score:<15", expected: ["apple", "kiwi"] },
      { query: "score:30", expected: ["cherry", "grape"] },
      { query: "score:>1000", expected: [] }
    ]
  },
  {
    name: "metric negated absolute comparison",
    cases: [
      { query: "-score:>15", expected: ["apple", "blueberry", "kiwi"] },
      { query: "-score:30", expected: ["apple", "banana", "blueberry", "kiwi", "mango", "orange", "pear", "strawberry"] }
    ]
  },
  {
    name: "metric absolute comparison with a tag",
    cases: [
      { query: "red score:>15", expected: ["cherry", "strawberry"] },
      { query: "red -score:<15", expected: ["cherry", "strawberry"] }
    ]
  },
  {
    name: "metric absolute comparison inside an or group",
    cases: [
      { query: "( score:>25 ~ yellow )", expected: ["banana", "cherry", "grape", "mango", "pear", "strawberry"] },
      { query: "( score:>1000 ~ red )", expected: ["apple", "cherry", "strawberry"] }
    ]
  },
  {
    name: "metric two absolute comparisons",
    cases: [{ query: "score:>15 score:<30", expected: ["banana", "orange"] }]
  },
  {
    name: "metric relative comparison",
    cases: [
      { query: "width:>height", expected: ["apple", "grape", "mango", "orange"] },
      { query: "width:<height", expected: ["banana", "kiwi", "strawberry"] }
    ]
  },
  {
    name: "metric negated relative comparison",
    cases: [{ query: "-width:>height", expected: ["banana", "blueberry", "cherry", "kiwi", "pear", "strawberry"] }]
  },
  {
    name: "metric relative comparison with a tag",
    cases: [{ query: "red width:>height", expected: ["apple"] }]
  },
  {
    name: "metric relative comparison inside an or group",
    cases: [{ query: "( width:>height ~ yellow )", expected: ["apple", "banana", "grape", "mango", "orange"] }]
  },
  {
    name: "metric compared to itself",
    cases: [
      { query: "width:width", expected: allDocNames },
      { query: "width:>width", expected: [] },
      { query: "width:<width", expected: [] }
    ]
  },
  {
    name: "metric negated and compared to itself",
    cases: [
      { query: "-width:width", expected: [] },
      { query: "-width:>width", expected: allDocNames }
    ]
  },
  {
    name: "tautological",
    cases: [
      { query: "width:width", expected: allDocNames },
      { query: "-width:>width", expected: allDocNames },
      { query: "-width:<width", expected: allDocNames },
      { query: "-height:>height", expected: allDocNames },
      { query: "( red ~ -red )", expected: allDocNames },
      { query: "( foo ~ -foo )", expected: allDocNames },
      { query: "( -* ~ * )", expected: allDocNames },
      { query: "( height:0 ~ -height:0 )", expected: allDocNames }
    ]
  }
];
