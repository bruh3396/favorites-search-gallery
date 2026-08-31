import { InvertedIndex } from "@/lib/collection/inverted_index";
import { InvertedIndexSearcher } from "@/lib/search/inverted_index_searcher";
import { Searchable } from "@/types/search";

export type FruitName = "apple" | "banana" | "cherry" | "grape" | "kiwi" | "mango" | "blueberry" | "orange" | "pear" | "strawberry" | "pineapple";
export type Fruit = Searchable & { name: FruitName };
export type AssertMatches = (query: string, expectedNames: FruitName[]) => void;

export function getPrefixes(word: string): string[] {
  const prefixes: string[] = [];

  for (let i = 1; i <= word.length; i += 1) {
    prefixes.push(word.slice(0, i));
  }
  return prefixes;
}

export function getAllSubstrings(word: string): string[] {
  const substrings: string[] = [];

  for (let start = 0; start < word.length; start += 1) {
    for (let end = start + 1; end <= word.length; end += 1) {
      substrings.push(word.slice(start, end));
    }
  }
  return substrings;
}

export function createSearchable(tags: string[]): Searchable {
  return { tags: new Set(tags) };
}

export const fruits = new Set([
  "grape",
  "banana",
  "apple",
  "orange",
  "kiwi",
  "mango",
  "peach",
  "pear",
  "plum",
  "cherry",
  "blueberry",
  "strawberry",
  "raspberry",
  "watermelon",
  "pineapple",
  "cantaloupe",
  "honeydew",
  "apricot",
  "blackberry",
  "papaya",
  "pomegranate",
  "fig",
  "tangerine",
  "nectarine",
  "coconut",
  "lychee",
  "jackfruit",
  "durian",
  "persimmon",
  "guava",
  "dragonfruit",
  "passionfruit",
  "starfruit",
  "kiwano",
  "clementine"
].sort());
export const searchableEmptyDoc = createSearchable([]);
export const searchableFruitDoc = createSearchable(Array.from(fruits));

export const fruitDocs: Fruit[] = [
  { name: "apple", tags: new Set(["apple", "red", "sour", "fiber", "green", "crunchy", "snack", "antioxidants", "low-fat_(dairy)"].sort()) },
  { name: "banana", tags: new Set(["banana", "yellow", "sour", "fiber", "100cal", "green", "potassium", "smooth", "breakfast"].sort()) },
  { name: "cherry", tags: new Set(["cherry", "red", "sweet", "fiber", "antioxidants", "tart", "small", "snack", "dessert"].sort()) },
  { name: "grape", tags: new Set(["grape", "purple", "sweet", "small", "green", "snack", "juicy", "antioxidants", "seedless"].sort()) },
  { name: "kiwi", tags: new Set(["kiwi", "green", "tart", "fiber", "vitamin-c", "fuzzy", "tropical", "small", "smoothie"].sort()) },
  { name: "mango", tags: new Set(["mango", "tropical", "sweet", "juicy", "fiber", "smoothie", "dessert", "vitamin-a"].sort()) },
  { name: "blueberry", tags: new Set(["blueberry", "blue", "small", "antioxidant", "sweet", "berry", "snack", "baking", "fiber"].sort()) },
  { name: "orange", tags: new Set(["orange", "citrus", "vitamin-c", "juicy", "fiber", "breakfast", "peelable", "snack"].sort()) },
  { name: "pear", tags: new Set(["pear", "green", "grainy", "fiber", "sweet", "soft", "juicy", "vitamin-c", "lunch"].sort()) },
  { name: "strawberry", tags: new Set(["strawberry", "red", "sweet", "berry", "juicy", "dessert", "vitamin-c", "smoothie", "antioxidants"].sort()) }
];
export const allDocNames = fruitDocs.map(item => item.name);
export const allTerms = fruitDocs.flatMap(item => Array.from(item.tags));
export const index = new InvertedIndex<Fruit>(fruit => fruit.tags);
export const searcher = new InvertedIndexSearcher<Fruit>(index);

fruitDocs.forEach(f => index.addDoc(f));

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
  }
];
