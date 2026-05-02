import { InvertedIndex } from "../lib/core/data_structures/inverted_index";
import { SearchEngine } from "../lib/search/engine/search_engine";
import { SearchQuery } from "../lib/search/query/search_query";
import { Searchable } from "../types/search";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

function randomElement<T>(array: T[] | string): T | string {
  return array[Math.floor(Math.random() * array.length)];
}

function randomLetter(): string {
  return randomElement(ALPHABET);
}

function randomWord(): string {
  const length = 1 + Math.floor(Math.random() * 10);
  let word = "";

  for (let i = 0; i < length; i += 1) {
    word += randomLetter();
  }
  return word;
}

function generateTags(count: number): string[] {
  header("generateTags");
  const tags: string[] = [];

  for (let i = 0; i < count; i += 1) {
    tags.push(randomWord());
  }
  return tags;
}

  function generateItems(count: number, allTags: string[]): Searchable[] {
    header("generateItems");
    const items: Searchable[] = [];

    for (let i = 0; i < count; i += 1) {
      const tags = new Set<string>();

      while (tags.size < 50) {
        tags.add(randomElement(allTags));
      }

      items.push({ tags: new Set([...tags].sort()) });
    }
    return items;
  }

function buildExactQuery(tags: string[]): string {
  return `${tags[0]}`;
}

function buildWildcardQuery(): string {
  return "ab* ba*";
}

function buildHeavyWildcardQuery(groups: number, termsPerGroup: number, charsPerTerm: number): string {
  const makeTerm = (): string => `${Array.from({ length: charsPerTerm }, randomLetter).join("")}*`;
  const makeGroup = (): string => `( ${Array.from({ length: termsPerGroup }, makeTerm).join(" ~ ")} )`;
  return Array.from({ length: groups }, makeGroup).join(" ");
}

function buildHeavyWildcardContainsQuery(groups: number, termsPerGroup: number, charsPerTerm: number): string {
  const makeTerm = (): string => `*${Array.from({ length: charsPerTerm }, randomLetter).join("")}*`;
  const makeGroup = (): string => `( ${Array.from({ length: termsPerGroup }, makeTerm).join(" ~ ")} )`;
  return Array.from({ length: groups }, makeGroup).join(" ");
}

function benchmark(label: string, fn: () => void): void {
  const startMark = `${label}-start`;
  const endMark = `${label}-end`;

  performance.mark(startMark);
  const start = performance.now();

  fn();

  const end = performance.now();

  performance.mark(endMark);
  performance.measure(label, startMark, endMark);
  console.log(`${label}: ${(end - start).toFixed(2)} ms`);
}

function header(label: string): void {
  console.log(`\n=== ${label} ===`);
}

export function compareSearchPerformance(): void {
  const itemCount = 100_000;
  const iterations = 40;
  const tags = generateTags(30_000);
  const items = generateItems(itemCount, tags);
  const index = new InvertedIndex<Searchable>(item => item.tags, true);
  const engine = new SearchEngine<Searchable>(index);

  items.forEach(item => index.addDoc(item));

  const benchmarks = [
    { name: "NON-WILDCARD", query: buildExactQuery(tags) },
    { name: "WILDCARD", query: buildWildcardQuery() },
    { name: "HEAVY WILDCARD", query: buildHeavyWildcardQuery(5, 5, 5) },
    { name: "HEAVY WILDCARD CONTAINS", query: buildHeavyWildcardContainsQuery(5, 5, 5) }
  ];

  for (const { name, query } of benchmarks) {
    header(name);
    console.log("Query:", query);
    // header("Result:");
    // console.log("SearchQuery.filter:", new SearchQuery<Searchable>(query).apply(items).length);
    // console.log("SearchEngine.search:", engine.search(new SearchQuery<Searchable>(query), items).length);
    // header("Time:");

    benchmark(`SearchQuery.filter ${name}`, () => {
      for (let i = 0; i < iterations; i += 1) {
        new SearchQuery<Searchable>(query).apply(items);
      }
    });
    benchmark(`SearchEngine.search ${name}`, () => {
      for (let i = 0; i < iterations; i += 1) {
        engine.search(new SearchQuery<Searchable>(query), items);
      }
    });
  }
}
compareSearchPerformance();
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (window as any).compareSearchPerformance = compareSearchPerformance;
