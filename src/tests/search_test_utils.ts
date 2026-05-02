import { InvertedIndex } from "../lib/core/data_structures/inverted_index";
import { SearchEngine } from "../lib/search/engine/search_engine";
import { Searchable } from "../types/search";

export type Fruit = Searchable & { name: string };

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
  return {
    tags: new Set(tags)
  };
}

export const empty = new Set<string>();
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
]);
export const sortedFruits = new Set(Array.from(fruits).sort());
export const searchableEmpty = createSearchable([]);
export const searchableFruits = createSearchable(Array.from(fruits));
export const searchableSortedFruits = createSearchable(Array.from(sortedFruits));

export const fruitItems: Fruit[] = [
  {name: "apple", tags: new Set(["apple", "red", "sour", "fiber", "green", "crunchy", "snack", "antioxidants", "low-fat_(dairy)"].sort())},
  {name: "banana", tags: new Set(["banana", "yellow", "sour", "fiber", "100cal", "green", "potassium", "smooth", "breakfast"].sort())},
  {name: "cherry", tags: new Set(["cherry", "red", "sweet", "fiber", "antioxidants", "tart", "small", "snack", "dessert"].sort())},
  {name: "grape", tags: new Set(["grape", "purple", "sweet", "small", "green", "snack", "juicy", "antioxidants", "seedless"].sort())},
  {name: "kiwi", tags: new Set(["kiwi", "green", "tart", "fiber", "vitamin-c", "fuzzy", "tropical", "small", "smoothie"].sort())},
  {name: "mango", tags: new Set(["mango", "tropical", "sweet", "juicy", "fiber", "smoothie", "dessert", "vitamin-a"].sort())},
  {name: "blueberry", tags: new Set(["blueberry", "blue", "small", "antioxidant", "sweet", "berry", "snack", "baking", "fiber"].sort())},
  {name: "orange", tags: new Set(["orange", "citrus", "vitamin-c", "juicy", "fiber", "breakfast", "peelable", "snack"].sort())},
  {name: "pear", tags: new Set(["pear", "green", "grainy", "fiber", "sweet", "soft", "juicy", "vitamin-c", "lunch"].sort())},
  {name: "strawberry", tags: new Set(["strawberry", "red", "sweet", "berry", "juicy", "dessert", "vitamin-c", "smoothie", "antioxidants"].sort())}
];
export const allItemNames = fruitItems.map(item => item.name);
export const allTags = fruitItems.flatMap(item => Array.from(item.tags));
export const index = new InvertedIndex<Fruit>(fruit => fruit.tags);
export const engine = new SearchEngine<Fruit>(index);

for (const item of fruitItems) {
  index.addDoc(item);
}
