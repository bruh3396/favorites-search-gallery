import { Readable } from "@/core/utils/reactive/signal";
import { StoredValue } from "@/core/utils/storage/stored_value";

export interface SearchHistoryConfiguration {
  readonly limit: number;
}

export const DEFAULT_SEARCH_HISTORY_CONFIGURATION: SearchHistoryConfiguration = {
  limit: 25
};

export interface SearchHistoryDependencies {
  submittedQueries: StoredValue<readonly string[]>;
}

export class SearchHistory {
  constructor(
    private readonly configuration: SearchHistoryConfiguration,
    private readonly dependencies: SearchHistoryDependencies
  ) { }

  public get submittedQueries(): Readable<readonly string[]> {
    return this.dependencies.submittedQueries;
  }

  public record(query: string): void {
    const trimmedQuery = query.trim();

    if (trimmedQuery === "") {
      return;
    }
    const otherQueries = this.dependencies.submittedQueries.peek().filter(otherQuery => otherQuery !== trimmedQuery);

    this.dependencies.submittedQueries.set([trimmedQuery, ...otherQueries].slice(0, this.configuration.limit));
  }
}
