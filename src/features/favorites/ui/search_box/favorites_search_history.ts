import { Storage } from "../../../../lib/core/storage/storage_instance";
import { indexInBounds } from "../../../../utils/collection/array";
import { isEmptyString } from "../../../../utils/string/query";
import { removeExtraWhiteSpace } from "../../../../utils/string/format";

export class SearchHistory {
  public lastEditedQuery: string;
  private history: string[];
  private index: number;
  private readonly depth: number;

  constructor(depth: number) {
    this.index = -1;
    this.history = this.loadSearchHistory();
    this.lastEditedQuery = this.loadLastEditedQuery();
    this.depth = depth;
  }

  public get selectedQuery(): string {
    if (indexInBounds(this.history, this.index)) {
      return this.history[this.index];
    }
    return this.lastEditedQuery;
  }

  public add(searchQuery: string): void {
    if (isEmptyString(searchQuery)) {
      return;
    }
    const searchHistory = this.history.slice();
    const cleanedSearchQuery = removeExtraWhiteSpace(searchQuery);
    const searchHistoryWithoutQuery = searchHistory.filter(search => search !== cleanedSearchQuery);
    const searchHistoryWithQueryAtFront = [searchQuery].concat(searchHistoryWithoutQuery);
    const truncatedSearchHistory = searchHistoryWithQueryAtFront.slice(0, this.depth);

    this.history = truncatedSearchHistory;
    Storage.set("searchHistory", this.history);
  }

  public updateLastEditedSearchQuery(searchQuery: string): void {
    this.lastEditedQuery = searchQuery;
    this.resetIndex();
    Storage.set("lastEditedSearchQuery", this.lastEditedQuery);
  }

  public navigate(direction: string): void {
    if (direction === "ArrowUp") {
      const selectedQuery = this.selectedQuery;

      this.incrementIndex();
      const queryHasNotChanged = this.selectedQuery === selectedQuery;

      if (queryHasNotChanged) {
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
    this.index = Math.min(this.index + 1, this.history.length - 1);
  }

  private decrementIndex(): void {
    this.index = Math.max(this.index - 1, -1);
  }
}
