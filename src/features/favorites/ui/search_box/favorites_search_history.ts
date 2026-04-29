import { Storage } from "../../../../lib/core/storage/storage_instance";
import { clamp } from "../../../../utils/number";
import { indexInBounds } from "../../../../utils/collection/array";
import { isEmptyString } from "../../../../utils/string/query";
import { removeExtraWhiteSpace } from "../../../../utils/string/format";

export class SearchHistory {
  private lastQuery: string;
  private history: string[];
  private index: number;
  private readonly depth: number;

  constructor(depth: number) {
    this.index = -1;
    this.history = this.loadSearchHistory();
    this.lastQuery = this.loadLastEditedQuery();
    this.depth = depth;
  }

  public get lastEditedQuery(): string {
    return this.lastQuery;
  }

  public get selectedQuery(): string {
    if (indexInBounds(this.history, this.index)) {
      return this.history[this.index];
    }
    return this.lastQuery;
  }

  public add(searchQuery: string): void {
    if (isEmptyString(searchQuery)) {
      return;
    }
    const cleaned = removeExtraWhiteSpace(searchQuery);
    const deduped = this.history.filter(entry => entry !== cleaned);
    const updated = [cleaned].concat(deduped).slice(0, this.depth);

    this.history = updated;
    Storage.set("searchHistory", this.history);
  }

  public setLastQuery(searchQuery: string): void {
    this.lastQuery = searchQuery;
    this.resetIndex();
    Storage.set("lastEditedSearchQuery", this.lastQuery);
  }

  public navigate(direction: "ArrowUp" | "ArrowDown"): void {
    if (direction === "ArrowUp") {
      const previous = this.selectedQuery;

      this.incrementIndex();

      // Skip duplicate entries when navigating up
      if (this.selectedQuery === previous) {
        this.incrementIndex();
      }
      return;
    }
    this.decrementIndex();
  }

  private loadSearchHistory(): string[] {
    return Storage.get<string[]>("searchHistory") ?? [];
  }

  private loadLastEditedQuery(): string {
    return Storage.get<string>("lastEditedSearchQuery") ?? "";
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
