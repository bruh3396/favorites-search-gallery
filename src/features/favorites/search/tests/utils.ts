import {Searchable} from "../../types/types";

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
