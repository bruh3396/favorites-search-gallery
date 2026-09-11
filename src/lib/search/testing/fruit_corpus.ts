import { MetricSearchable, SearchableMetric } from "@/types/search";
import { InvertedIndex } from "@/lib/search/engines/set/indexes/inverted_index";
import { createSearchable } from "@/lib/search/testing/searchable";

export type FruitName = "apple" | "banana" | "cherry" | "grape" | "kiwi" | "mango" | "blueberry" | "orange" | "pear" | "strawberry" | "pineapple";
export type Fruit = MetricSearchable & { name: FruitName };

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

function fruit(name: FruitName, tags: string[], metrics: Partial<Record<SearchableMetric, number>>): Fruit {
  return {
    name,
    tags: new Set(tags.slice().sort()),
    getMetric: (metric: SearchableMetric): number => metrics[metric] ?? 0
  };
}

export const fruitDocs: Fruit[] = [
  fruit("apple", ["apple", "red", "sour", "fiber", "green", "crunchy", "snack", "antioxidants", "low-fat_(dairy)"], { score: 10, width: 400, height: 100 }),
  fruit("banana", ["banana", "yellow", "sour", "fiber", "100cal", "green", "potassium", "smooth", "breakfast", "a12345"], { score: 20, width: 100, height: 400 }),
  fruit("cherry", ["cherry", "red", "sweet", "fiber", "antioxidants", "tart", "small", "snack", "dessert"], { score: 30, width: 200, height: 200 }),
  fruit("grape", ["grape", "purple", "sweet", "small", "green", "snack", "juicy", "antioxidants", "seedless"], { score: 30, width: 300, height: 150 }),
  fruit("kiwi", ["kiwi", "green", "tart", "fiber", "vitamin-c", "fuzzy", "tropical", "small", "smoothie"], { score: 5, width: 150, height: 300 }),
  fruit("mango", ["mango", "tropical", "sweet", "juicy", "fiber", "smoothie", "dessert", "vitamin-a"], { score: 45, width: 350, height: 250 }),
  fruit("blueberry", ["blueberry", "blue", "small", "antioxidant", "sweet", "berry", "snack", "baking", "fiber"], { score: 15, width: 120, height: 120 }),
  fruit("orange", ["orange", "citrus", "vitamin-c", "juicy", "fiber", "breakfast", "peelable", "snack"], { score: 25, width: 260, height: 180 }),
  fruit("pear", ["pear", "green", "grainy", "fiber", "sweet", "soft", "juicy", "vitamin-c", "lunch"], { score: 40, width: 220, height: 220 }),
  fruit("strawberry", ["strawberry", "red", "sweet", "berry", "juicy", "dessert", "vitamin-c", "smoothie", "antioxidants"], { score: 35, width: 180, height: 320 })
];
export const allDocNames = fruitDocs.map(item => item.name);
export const allTerms = fruitDocs.flatMap(item => Array.from(item.tags));
export const index = new InvertedIndex<Fruit>(f => f.tags);

fruitDocs.forEach(f => index.addDoc(f));
