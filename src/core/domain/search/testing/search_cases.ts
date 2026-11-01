import { Fruit, FruitName, fruitNames, allTerms, fruits } from "@/core/domain/search/testing/fruit_corpus";

export type QueryAssertion = (query: string, expectedFruitNames: FruitName[]) => void;
export type SearchCase = { query: string; expectedFruitNames: FruitName[] };
export type SearchCaseGroup = { name: string; cases?: SearchCase[]; run?: (assert: QueryAssertion) => void; isAST?: boolean };

function matchesTagOrId(fruit: Fruit, tag: string): boolean {
  return fruit.tags.has(tag) || ((/^\d+$/).test(tag) && fruit.getMetric("id") === Number(tag));
}

export const searchCaseGroups: SearchCaseGroup[] = [
  {
    name: "empty",
    cases: [
      { query: "", expectedFruitNames: fruitNames },
      { query: " ", expectedFruitNames: fruitNames },
      { query: " \n\t", expectedFruitNames: fruitNames }
    ]
  },
  {
    name: "all",
    cases: [
      { query: "*", expectedFruitNames: fruitNames },
      { query: "**", expectedFruitNames: fruitNames },
      { query: "* ** *** **** *****", expectedFruitNames: fruitNames }
    ]
  },
  {
    name: "names",
    run: (assert: QueryAssertion): void => {
      for (const fruit of fruits) {
        assert(fruit.name, [fruit.name]);
      }
    }
  },
  {
    name: "and",
    cases: [
      { query: "low-fat_(dairy)", expectedFruitNames: ["apple"] },
      { query: "red", expectedFruitNames: ["apple", "cherry", "strawberry"] },
      { query: "red sweet", expectedFruitNames: ["cherry", "strawberry"] },
      { query: "red -sweet", expectedFruitNames: ["apple"] },
      { query: "red apple", expectedFruitNames: ["apple"] },
      { query: "red banana", expectedFruitNames: [] },
      { query: "berry", expectedFruitNames: ["blueberry", "strawberry"] },
      { query: "antioxidants", expectedFruitNames: ["apple", "cherry", "grape", "strawberry"] },
      { query: "antioxidant", expectedFruitNames: ["blueberry"] },
      { query: "antioxidants -antioxidant", expectedFruitNames: ["apple", "cherry", "grape", "strawberry"] },
      { query: "vitamin-c", expectedFruitNames: ["kiwi", "orange", "pear", "strawberry"] },
      { query: "juicy fiber -citrus", expectedFruitNames: ["mango", "pear"] },
      { query: "sweet -berry", expectedFruitNames: ["cherry", "grape", "mango", "pear"] },
      { query: "tropical -mango", expectedFruitNames: ["kiwi"] }
    ]
  },
  {
    name: "or",
    cases: [
      { query: "( red ~ blue )", expectedFruitNames: ["apple", "cherry", "strawberry", "blueberry"] },
      { query: "( red ~ blue ) ( apple ~ cherry )", expectedFruitNames: ["apple", "cherry"] },
      { query: "( berry ~ tart )", expectedFruitNames: ["blueberry", "cherry", "kiwi", "strawberry"] },
      { query: "( vitamin-c ~ antioxidants ) sweet", expectedFruitNames: ["cherry", "grape", "pear", "strawberry"] },
      { query: "( red ~ green ) -snack", expectedFruitNames: ["banana", "kiwi", "pear", "strawberry"] },
      { query: "( tart ~ tropical ) ( fiber ~ smoothie )", expectedFruitNames: ["cherry", "kiwi", "mango"] }
    ]
  },
  {
    name: "negated or",
    cases: [
      { query: "( red ~ -red )", expectedFruitNames: fruitNames },
      { query: "( red ~ -sweet )", expectedFruitNames: ["apple", "banana", "cherry", "kiwi", "orange", "strawberry"] },
      { query: "( -red ~ -sweet )", expectedFruitNames: ["apple", "banana", "blueberry", "grape", "kiwi", "mango", "orange", "pear"] },
      { query: "( red ~ -berry )", expectedFruitNames: ["apple", "banana", "cherry", "grape", "kiwi", "mango", "orange", "pear", "strawberry"] },
      { query: "( -* ~ red )", expectedFruitNames: ["apple", "cherry", "strawberry"] },
      { query: "fiber ( sweet ~ -red )", expectedFruitNames: ["banana", "blueberry", "cherry", "kiwi", "mango", "orange", "pear"] }
    ]
  },
  {
    name: "negated group",
    isAST: true,
    cases: [
      { query: "-( red ~ sweet )", expectedFruitNames: ["banana", "kiwi", "orange"] },
      { query: "-( red sweet )", expectedFruitNames: ["apple", "banana", "grape", "kiwi", "mango", "blueberry", "orange", "pear"] },
      { query: "sweet -( berry ~ snack )", expectedFruitNames: ["mango", "pear"] },
      { query: "( antioxidants ~ -( green ~ berry ) )", expectedFruitNames: ["apple", "cherry", "grape", "mango", "orange", "strawberry"] },
      { query: "-( red )", expectedFruitNames: ["banana", "grape", "kiwi", "mango", "blueberry", "orange", "pear"] },
      { query: "red -( sweet ~ tart )", expectedFruitNames: ["apple"] }
    ]
  },
  {
    name: "nested or",
    cases: [
      { query: "( red ~ ( sweet berry ) )", expectedFruitNames: ["apple", "cherry", "strawberry", "blueberry"] },
      { query: "( ( sweet berry ) ~ red )", expectedFruitNames: ["apple", "cherry", "strawberry", "blueberry"] },
      { query: "( apple ~ ( green tropical ) )", expectedFruitNames: ["apple", "kiwi"] },
      { query: "( ( juicy citrus ) ~ ( grainy soft ) )", expectedFruitNames: ["orange", "pear"] },
      { query: "green ( red ~ ( fiber tart ) )", expectedFruitNames: ["apple", "kiwi"] }
    ]
  },
  {
    name: "deeply nested",
    isAST: true,
    cases: [
      { query: "( red ~ ( sweet ( berry ~ tart ) ) )", expectedFruitNames: ["apple", "blueberry", "cherry", "strawberry"] },
      { query: "( ( red ~ green ) ( sweet ~ tart ) )", expectedFruitNames: ["cherry", "grape", "kiwi", "pear", "strawberry"] },
      { query: "( ( red sweet ) ~ ( green juicy ) )", expectedFruitNames: ["cherry", "grape", "pear", "strawberry"] },
      { query: "tropical ( sweet ~ ( fiber tart ) )", expectedFruitNames: ["kiwi", "mango"] },
      { query: "( red ~ ( green ( -sweet ~ tart ) ) )", expectedFruitNames: ["apple", "banana", "cherry", "kiwi", "strawberry"] }
    ]
  },
  {
    name: "wildcard",
    cases: [
      { query: "ch*", expectedFruitNames: ["cherry"] },
      { query: "r*", expectedFruitNames: ["apple", "cherry", "strawberry"] },
      { query: "*ch", expectedFruitNames: ["pear"] },
      { query: "-*ch -ch* *ch*", expectedFruitNames: ["apple"] },
      { query: "*ch*", expectedFruitNames: ["apple", "cherry", "pear"] },
      { query: "berr*", expectedFruitNames: ["blueberry", "strawberry"] },
      { query: "*berry", expectedFruitNames: ["blueberry", "strawberry"] },
      { query: "*erry*", expectedFruitNames: ["blueberry", "cherry", "strawberry"] },
      { query: "vitamin-*", expectedFruitNames: ["kiwi", "mango", "orange", "pear", "strawberry"] },
      { query: "*c", expectedFruitNames: ["kiwi", "orange", "pear", "strawberry"] },
      { query: "*vita*", expectedFruitNames: ["kiwi", "mango", "orange", "pear", "strawberry"] }
    ]
  },
  {
    name: "mixed",
    cases: [
      { query: "( red ~ blue ) sweet", expectedFruitNames: ["cherry", "strawberry", "blueberry"] },
      { query: "( red ~ blue ) -*we*t", expectedFruitNames: ["apple"] },
      { query: "( red ~ blue ) ( apple ~ ch*y )", expectedFruitNames: ["apple", "cherry"] },
      { query: "( red ~ blue ) ( a* ~ cherry ) -sweet", expectedFruitNames: ["apple"] },
      { query: "( r* ~ blue ) ( apple ~ cherry ) -sweet -red", expectedFruitNames: [] },
      { query: "*berry* sweet", expectedFruitNames: ["blueberry", "strawberry"] },
      { query: "sweet -*berry", expectedFruitNames: ["cherry", "grape", "mango", "pear"] },
      { query: "( s* ~ vitamin-* ) -sweet", expectedFruitNames: ["apple", "banana", "kiwi", "orange"] },
      { query: "fiber sweet -*berry -green", expectedFruitNames: ["cherry", "mango"] },
      { query: "small -*berry -green", expectedFruitNames: ["cherry"] }
    ]
  },
  {
    name: "invalid",
    cases: [
      { query: "( ~ )", expectedFruitNames: [] },
      { query: "( )", expectedFruitNames: [] },
      { query: "()", expectedFruitNames: [] },
      { query: "(", expectedFruitNames: [] },
      { query: ")", expectedFruitNames: [] },
      { query: "-", expectedFruitNames: [] },
      { query: ")-", expectedFruitNames: [] },
      { query: ")) apple", expectedFruitNames: [] },
      { query: ")) *", expectedFruitNames: [] },
      { query: "(apple )", expectedFruitNames: [] },
      { query: "( apple)", expectedFruitNames: [] },
      { query: "( apple ~banana )", expectedFruitNames: [] },
      { query: "( apple~banana )", expectedFruitNames: [] },
      { query: "( apple~ banana )", expectedFruitNames: [] },
      { query: "( apple ~ banana)", expectedFruitNames: [] },
      { query: "apple )", expectedFruitNames: [] },
      { query: "apple (", expectedFruitNames: [] }
    ]
  },
  {
    name: "all tags",
    run: (assert: QueryAssertion): void => {
      const orAllQuery = `( ${[...allTerms].join(" ~ ")} )`;
      const andAllQuery = `${[...allTerms].join(" ")}`;

      assert(orAllQuery, fruitNames);
      assert(andAllQuery, []);

      for (const tag of allTerms) {
        assert(tag, fruits.filter(fruit => matchesTagOrId(fruit, tag)).map(fruit => fruit.name));
        assert(`-${tag}`, fruits.filter(fruit => !matchesTagOrId(fruit, tag)).map(fruit => fruit.name));
      }
    }
  },
  {
    name: "contradiction",
    cases: [
      { query: "red -red", expectedFruitNames: [] },
      { query: "red -r*", expectedFruitNames: [] },
      { query: "red -*", expectedFruitNames: [] },
      { query: "red -*red*", expectedFruitNames: [] },
      { query: "red -red*", expectedFruitNames: [] },
      { query: "red -*red", expectedFruitNames: [] }
    ]
  },
  {
    name: "wildcard edge cases",
    cases: [
      { query: "zzz*", expectedFruitNames: [] },
      { query: "*zzz*", expectedFruitNames: [] },
      { query: "*zzz", expectedFruitNames: [] },
      { query: "*z*z*", expectedFruitNames: ["kiwi"] },
      { query: "( zzz* ~ red )", expectedFruitNames: ["apple", "cherry", "strawberry"] },
      { query: "( zzz* ~ zzy* )", expectedFruitNames: [] },
      { query: "*ow*fat*", expectedFruitNames: ["apple"] },
      { query: "*ita*a", expectedFruitNames: ["mango"] },
      { query: "*ita*c", expectedFruitNames: ["kiwi", "orange", "pear", "strawberry"] },
      { query: "-*ita*c", expectedFruitNames: ["apple", "banana", "blueberry", "cherry", "grape", "mango"] },
      { query: "*vitamin-*", expectedFruitNames: ["kiwi", "mango", "orange", "pear", "strawberry"] },
      { query: "( *ita*a ~ *ita*c )", expectedFruitNames: ["kiwi", "mango", "orange", "pear", "strawberry"] },
      { query: "( *fat* ~ vitamin* )", expectedFruitNames: ["apple", "kiwi", "mango", "orange", "pear", "strawberry"] },
      { query: "( *fat* ~ red )", expectedFruitNames: ["apple", "cherry", "strawberry"] }
    ]
  },
  {
    name: "metric absolute comparison",
    cases: [
      { query: "score:>15", expectedFruitNames: ["banana", "cherry", "grape", "mango", "orange", "pear", "strawberry"] },
      { query: "score:<15", expectedFruitNames: ["apple", "kiwi"] },
      { query: "score:30", expectedFruitNames: ["cherry", "grape"] },
      { query: "score:>1000", expectedFruitNames: [] }
    ]
  },
  {
    name: "metric negated absolute comparison",
    cases: [
      { query: "-score:>15", expectedFruitNames: ["apple", "blueberry", "kiwi"] },
      { query: "-score:30", expectedFruitNames: ["apple", "banana", "blueberry", "kiwi", "mango", "orange", "pear", "strawberry"] }
    ]
  },
  {
    name: "metric absolute comparison with a tag",
    cases: [
      { query: "red score:>15", expectedFruitNames: ["cherry", "strawberry"] },
      { query: "red -score:<15", expectedFruitNames: ["cherry", "strawberry"] }
    ]
  },
  {
    name: "metric absolute comparison inside an or group",
    cases: [
      { query: "( score:>25 ~ yellow )", expectedFruitNames: ["banana", "cherry", "grape", "mango", "pear", "strawberry"] },
      { query: "( score:>1000 ~ red )", expectedFruitNames: ["apple", "cherry", "strawberry"] }
    ]
  },
  {
    name: "metric two absolute comparisons",
    cases: [{ query: "score:>15 score:<30", expectedFruitNames: ["banana", "orange"] }]
  },
  {
    name: "metric duration absolute comparison",
    cases: [
      { query: "duration:>100", expectedFruitNames: ["cherry", "kiwi", "mango", "strawberry"] },
      { query: "duration:<100", expectedFruitNames: ["apple", "banana", "blueberry", "grape", "orange", "pear"] },
      { query: "duration:200", expectedFruitNames: ["cherry"] },
      { query: "duration:>1000", expectedFruitNames: [] },
      { query: "-duration:>100", expectedFruitNames: ["apple", "banana", "blueberry", "grape", "orange", "pear"] },
      { query: "red duration:>100", expectedFruitNames: ["cherry", "strawberry"] }
    ]
  },
  {
    name: "metric duration relative comparison",
    cases: [
      { query: "duration:>score", expectedFruitNames: ["apple", "cherry", "kiwi", "mango", "orange", "strawberry"] },
      { query: "duration:score", expectedFruitNames: ["banana", "blueberry", "grape", "pear"] },
      { query: "duration:duration", expectedFruitNames: fruitNames },
      { query: "duration:>duration", expectedFruitNames: [] }
    ]
  },
  {
    name: "metric relative comparison",
    cases: [
      { query: "width:>height", expectedFruitNames: ["apple", "grape", "mango", "orange"] },
      { query: "width:<height", expectedFruitNames: ["banana", "kiwi", "strawberry"] }
    ]
  },
  {
    name: "metric negated relative comparison",
    cases: [{ query: "-width:>height", expectedFruitNames: ["banana", "blueberry", "cherry", "kiwi", "pear", "strawberry"] }]
  },
  {
    name: "metric relative comparison with a tag",
    cases: [{ query: "red width:>height", expectedFruitNames: ["apple"] }]
  },
  {
    name: "metric relative comparison inside an or group",
    cases: [{ query: "( width:>height ~ yellow )", expectedFruitNames: ["apple", "banana", "grape", "mango", "orange"] }]
  },
  {
    name: "metric compared to itself",
    cases: [
      { query: "width:width", expectedFruitNames: fruitNames },
      { query: "width:>width", expectedFruitNames: [] },
      { query: "width:<width", expectedFruitNames: [] }
    ]
  },
  {
    name: "metric negated and compared to itself",
    cases: [
      { query: "-width:width", expectedFruitNames: [] },
      { query: "-width:>width", expectedFruitNames: fruitNames }
    ]
  },
  {
    name: "numeric matches by tag or id",
    cases: [
      { query: "200", expectedFruitNames: ["apple", "grape"] },
      { query: "305", expectedFruitNames: ["grape"] },
      { query: "88", expectedFruitNames: ["cherry"] },
      { query: "101", expectedFruitNames: ["banana"] },
      { query: "999", expectedFruitNames: [] }
    ]
  },
  {
    name: "numeric negated",
    cases: [
      { query: "-200", expectedFruitNames: ["banana", "cherry", "kiwi", "mango", "blueberry", "orange", "pear", "strawberry"] },
      { query: "-999", expectedFruitNames: fruitNames }
    ]
  },
  {
    name: "numeric with a tag",
    cases: [
      { query: "200 red", expectedFruitNames: ["apple"] },
      { query: "200 -red", expectedFruitNames: ["grape"] }
    ]
  },
  {
    name: "numeric inside an or group",
    cases: [
      { query: "( 200 ~ blue )", expectedFruitNames: ["apple", "grape", "blueberry"] },
      { query: "( 88 ~ 200 )", expectedFruitNames: ["apple", "cherry", "grape"] },
      { query: "( 200 ~ red )", expectedFruitNames: ["apple", "cherry", "grape", "strawberry"] }
    ]
  },
  {
    name: "explicit id metric does not expand to the tag",
    cases: [
      { query: "id:200", expectedFruitNames: ["apple"] },
      { query: "id:305", expectedFruitNames: ["grape"] },
      { query: "id:88", expectedFruitNames: ["cherry"] },
      { query: "id:200 200", expectedFruitNames: ["apple"] },
      { query: "( id:200 ~ blue )", expectedFruitNames: ["apple", "blueberry"] }
    ]
  },
  {
    name: "tautological",
    cases: [
      { query: "width:width", expectedFruitNames: fruitNames },
      { query: "-width:>width", expectedFruitNames: fruitNames },
      { query: "-width:<width", expectedFruitNames: fruitNames },
      { query: "-height:>height", expectedFruitNames: fruitNames },
      { query: "( red ~ -red )", expectedFruitNames: fruitNames },
      { query: "( apple ~ -apple )", expectedFruitNames: fruitNames },
      { query: "( -* ~ * )", expectedFruitNames: fruitNames },
      { query: "( height:0 ~ -height:0 )", expectedFruitNames: fruitNames }
    ]
  }
];
