import { Searchable } from "@/types/search";

export interface SearchEngine<Doc extends Searchable> {
  search(query: string, candidates: Doc[]): Doc[];
  index(docs: Doc[]): void;
  add(doc: Doc): void;
  remove(doc: Doc): void;
}
