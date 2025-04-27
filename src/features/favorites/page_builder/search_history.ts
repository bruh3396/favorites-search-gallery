import {isEmptyString, removeExtraWhiteSpace} from "../../../utils/primitive/string";
import {indexInBounds} from "../../../utils/array/array";

export class SearchHistory {
  private history: string[];
  private index: number;
  public lastEditedQuery: string;
  private readonly depth: number;

  get selectedQuery(): string {
    if (indexInBounds(this.history, this.index)) {
      return this.history[this.index];
    }
    return this.lastEditedQuery;
  }

  constructor(depth: number) {
    this.index = -1;
    this.history = this.loadSearchHistory();
    this.lastEditedQuery = this.loadLastEditedQuery();
    this.depth = depth;
  }

  private loadSearchHistory(): string[] {
    return JSON.parse(localStorage.getItem("searchHistory") || "[]");
  }

  private loadLastEditedQuery(): string {
    return localStorage.getItem("lastEditedSearchQuery") || "";
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
    localStorage.setItem("searchHistory", JSON.stringify(this.history));
  }

  public updateLastEditedSearchQuery(searchQuery: string): void {
    this.lastEditedQuery = searchQuery;
    this.resetIndex();
    localStorage.setItem("lastEditedSearchQuery", this.lastEditedQuery);
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
}
