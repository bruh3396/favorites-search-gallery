import { InvertedSearchIndex } from "../index/inverted_search_index";
import { Searchable } from "../../../../../types/common_types";

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

export const EMPTY = new Set<string>();
export const FRUITS = new Set([
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
export const SORTED_FRUITS = new Set(Array.from(FRUITS).sort());
export const SEARCHABLE_EMPTY = createSearchable([]);
export const SEARCHABLE_FRUITS = createSearchable(Array.from(FRUITS));
export const SEARCHABLE_SORTED_FRUITS = createSearchable(Array.from(SORTED_FRUITS));
export type Fruit = Searchable & { name: string };

export const ITEMS: Fruit[] = [
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

export const ALL_ITEM_NAMES = ITEMS.map(item => item.name);
export const ALL_TAGS = ITEMS.flatMap(item => Array.from(item.tags));
export const INDEX = new InvertedSearchIndex<Fruit>();

for (const item of ITEMS) {
  INDEX.add(item);
}
