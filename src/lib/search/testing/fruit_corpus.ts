import { InvertedIndex } from "@/lib/collection/inverted_index";
import { Searchable } from "@/types/search";
import { createSearchable } from "@/lib/search/testing/searchable";

export type FruitName = "apple" | "banana" | "cherry" | "grape" | "kiwi" | "mango" | "blueberry" | "orange" | "pear" | "strawberry" | "pineapple";
export type Fruit = Searchable & { name: FruitName };

export const fruits = new Set([
  "apple", "apricot", "banana", "blackberry", "blueberry",
  "cantaloupe", "cherry", "clementine", "coconut", "dragonfruit",
  "durian", "fig", "grape", "guava", "honeydew",
  "jackfruit", "kiwano", "kiwi", "lychee", "mango",
  "nectarine", "orange", "papaya", "passionfruit", "peach",
  "pear", "persimmon", "pineapple", "plum", "pomegranate",
  "raspberry", "starfruit", "strawberry", "tangerine", "watermelon"
].sort());
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

fruitDocs.forEach(f => index.addDoc(f));
