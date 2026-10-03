import { Post } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler";

export interface Rule34NewFavoritesFinderConfiguration {
  pageSize: number;
  requiredContinuity: number;
  fetchDelay: number;
}

export interface Rule34NewFavoritesFinderDependencies {
  fetch: (pageIndex: number) => Promise<Post[]>;
  scheduler: Pick<Scheduler, "sleep">;
}

interface Continuity {
  start: number;
  length: number;
}

export class Rule34NewFavoritesFinder {
  private readonly siteFavoritesSoFar: Post[] = [];
  private storedPositions = new Map<string, number>();

  constructor(
    private readonly configuration: Rule34NewFavoritesFinderConfiguration,
    private readonly dependencies: Rule34NewFavoritesFinderDependencies
  ) { }

  public async findNew(storedIds: readonly string[], firstPage?: Post[]): Promise<Post[]> {
    this.storedPositions = new Map(storedIds.map((id, index) => [id, index]));
    let pageIndex = 0;
    let page = firstPage ?? await this.dependencies.fetch(pageIndex);

    while (true) {
      this.siteFavoritesSoFar.push(...page);
      const continuityStart = this.findContinuityStart(page);

      if (continuityStart !== null) {
        return this.siteFavoritesSoFar.slice(0, continuityStart);
      }
      pageIndex += 1;
      await this.dependencies.scheduler.sleep(this.configuration.fetchDelay);
      page = await this.dependencies.fetch(pageIndex);
    }
  }

  private findContinuityStart(page: Post[]): number | null {
    const continuity = this.findContinuity();
    const hasRequiredContinuity = continuity.length >= this.configuration.requiredContinuity;
    const isLastPage = page.length < this.configuration.pageSize;

    if (hasRequiredContinuity || isLastPage) {
      return continuity.start;
    }
    return null;
  }

  private findContinuity(): Continuity {
    let continuityStart: number | null = null;
    let lastStoredPosition = -1;

    for (const [siteIndex, post] of this.siteFavoritesSoFar.entries()) {
      const storedPosition = this.storedPositions.get(post.id);

      if (storedPosition === undefined) {
        continuityStart = null;
        continue;
      }

      if (continuityStart === null || storedPosition < lastStoredPosition) {
        continuityStart = siteIndex;
      }
      lastStoredPosition = storedPosition;
      const continuityLength = siteIndex - continuityStart + 1;

      if (continuityLength >= this.configuration.requiredContinuity) {
        return { start: continuityStart, length: continuityLength };
      }
    }
    return this.measureContinuityToEnd(continuityStart);
  }

  private measureContinuityToEnd(continuityStart: number | null): Continuity {
    if (continuityStart === null) {
      return { start: this.siteFavoritesSoFar.length, length: 0 };
    }
    return { start: continuityStart, length: this.siteFavoritesSoFar.length - continuityStart };
  }
}
