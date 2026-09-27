import { isEmptyString, removeExtraWhitespace } from "@/utils/pure/string";
import { KeyValueStorage } from "@/features/favorites/types/types";
import { clamp } from "@/utils/pure/number";
import { debounceLeading } from "@/lib/async/rate_limiting";
import { isIndexInBounds } from "@/utils/pure/array";

const PERSIST_DELAY = 500;

export class FavoritesSearchHistory {
  private lastQuery: string;
  private history: string[];
  private index: number;
  private readonly depth: number;
  private readonly storage: KeyValueStorage;
  private readonly persistLastQueryLazily: () => void;

  constructor(depth: number, storage: KeyValueStorage) {
    this.storage = storage;
    this.persistLastQueryLazily = debounceLeading(() => this.persistLastQuery(), PERSIST_DELAY);
    this.index = -1;
    this.history = this.loadSearchHistory();
    this.lastQuery = this.loadLastEditedQuery();
    this.depth = depth;
  }

  public get lastEditedQuery(): string {
    return this.lastQuery;
  }

  public get selectedQuery(): string {
    if (isIndexInBounds(this.history, this.index)) {
      return this.history[this.index];
    }
    return this.lastQuery;
  }

  public add(searchQuery: string): void {
    this.setLastQuery(searchQuery);

    if (isEmptyString(searchQuery)) {
      return;
    }
    const cleaned = removeExtraWhitespace(searchQuery);
    const deduped = this.history.filter(entry => entry !== cleaned);
    const updated = [cleaned].concat(deduped).slice(0, this.depth);

    this.history = updated;
    this.storage.set("searchHistory", this.history);
  }

  public setLastQuery(searchQuery: string): void {
    this.lastQuery = searchQuery;
    this.resetIndex();
    this.persistLastQuery();
  }

  public editLastQuery(searchQuery: string): void {
    this.lastQuery = searchQuery;
    this.resetIndex();
    this.persistLastQueryLazily();
  }

  public navigate(direction: "ArrowUp" | "ArrowDown"): void {
    if (direction === "ArrowUp") {
      const previous = this.selectedQuery;

      this.incrementIndex();

      if (this.selectedQuery === previous) {
        this.incrementIndex();
      }
      return;
    }
    this.decrementIndex();
  }

  private persistLastQuery(): void {
    this.storage.set("lastEditedSearchQuery", this.lastQuery);
  }

  private loadSearchHistory(): string[] {
    return this.storage.get<string[]>("searchHistory") ?? [];
  }

  private loadLastEditedQuery(): string {
    return this.storage.get<string>("lastEditedSearchQuery") ?? "";
  }

  private resetIndex(): void {
    this.index = -1;
  }

  private incrementIndex(): void {
    this.index = clamp(this.index + 1, -1, this.history.length - 1);
  }

  private decrementIndex(): void {
    this.index = clamp(this.index - 1, -1, this.history.length - 1);
  }
}
