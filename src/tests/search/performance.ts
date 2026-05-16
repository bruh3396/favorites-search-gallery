import { InvertedIndex } from "../../lib/core/data_structures/inverted_index";
import { InvertedIndexSearcher } from "../../lib/search/index/inverted_index_searcher";
import { SearchQuery } from "../../lib/search/query/search_query";
import { Searchable } from "../../types/search";

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

function generateTerms(count: number): string[] {
  header("generateTerms");
  const terms: string[] = [];

  for (let i = 0; i < count; i += 1) {
    terms.push(randomWord());
  }
  return terms;
}

function generateDocs(count: number, allTerms: string[]): Searchable[] {
  header("generateDocs");
  const docs: Searchable[] = [];

  for (let i = 0; i < count; i += 1) {
    const terms = new Set<string>();

    while (terms.size < TERMS_PER_DOC) {
      terms.add(randomElement(allTerms));
    }

    docs.push({ tags: new Set([...terms].sort()) });
  }
  return docs;
}

function buildExactQuery(terms: string[]): string {
  return `${terms[0]}`;
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

function benchmark(label: string, fn: () => void, iterations: number): void {
  const startMark = `${label}-start`;
  const endMark = `${label}-end`;

  performance.mark(startMark);
  const start = performance.now();

  for (let i = 0; i < iterations; i += 1) {
    fn();
  }

  const end = performance.now();

  performance.mark(endMark);
  performance.measure(label, startMark, endMark);
  console.log(`${label}: ${((end - start) / iterations).toFixed(2)} ms (average)`);
}

function header(label: string): void {
  console.log(`\n=== ${label} ===`);
}

export function compareSearchPerformance(): void {
  const terms = generateTerms(TERM_COUNT);
  const docs = generateDocs(DOC_COUNT, terms);
  const index = new InvertedIndex<Searchable>(doc => doc.tags, true);
  const engine = new InvertedIndexSearcher<Searchable>(index);

  docs.forEach(doc => index.addDoc(doc));

  const benchmarks = [
    { name: "NON-WILDCARD", query: buildExactQuery(terms) },
    { name: "WILDCARD", query: buildWildcardQuery() },
    { name: "HEAVY WILDCARD", query: buildHeavyWildcardQuery(4, 4, 3) },
    { name: "HEAVY WILDCARD CONTAINS", query: buildHeavyWildcardContainsQuery(4, 4, 3) }
  ];

  for (const { name, query } of benchmarks) {
    const searchQuery = new SearchQuery<Searchable>(query);

    header(`${name} x${ITERATIONS}`);
    benchmark(`SearchQuery ${name}`, () => searchQuery.apply(docs), ITERATIONS);
    benchmark(`SearchEngine ${name}`, () => engine.search(searchQuery, docs), ITERATIONS);
  }
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const DOC_COUNT = 200_000;
const TERM_COUNT = 50_000;
const TERMS_PER_DOC = 50;
const ITERATIONS = 3;

compareSearchPerformance();
