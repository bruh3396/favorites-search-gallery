import { FruitName, allDocNames, allTerms, fruitDocs } from "@/lib/search/testing/fruit_corpus";

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
      assert("12345", []);
      assert("-12345", allDocNames);
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
    }
  }
];
