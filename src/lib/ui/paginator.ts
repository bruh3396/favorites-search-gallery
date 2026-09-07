import { clamp, navigationDelta } from "@/utils/pure/number";
import { Identifiable } from "@/types/app";
import { NavigationKey } from "@/types/input";
import { PaginationState } from "@/types/ui";
import { paginationSequence } from "@/lib/ui/pagination";

export class Paginator<T extends Identifiable> {
  private current = 1;
  private items: T[] = [];

  constructor(
    private readonly resultsPerPage: () => number,
    private readonly nearbyPageCount: number
  ) {}

  public atFinalPage(): boolean {
    return this.current === this.pageCount();
  }

  public hasOnlyOnePage(): boolean {
    return this.pageCount() === 1;
  }

  public currentPageItems(): T[] {
    return this.itemsOnPage(this.current);
  }

  public adjacentPageItems(): T[] {
    return [...this.itemsOnPage(this.current - 1), ...this.itemsOnPage(this.current + 1)];
  }

  public selectAdjacentPage(direction: NavigationKey): boolean {
    return this.selectPage(this.current + navigationDelta(direction));
  }

  public selectWrappedAdjacentPage(direction: NavigationKey): boolean {
    return this.selectPage(this.wrappedPage(this.current, navigationDelta(direction), this.pageCount()));
  }

  public paginate(newItems: T[]): T[] {
    return (this.items = newItems);
  }

  public selectPage(pageNumber: number): boolean {
    const target = clamp(pageNumber, 1, this.pageCount());
    const wasChanged = target !== this.current;

    this.current = target;
    return wasChanged;
  }

  public selectPageContaining(id: string): boolean {
    const index = this.items.findIndex(item => item.id === id);
    return index !== -1 && this.selectPage(Math.floor(index / this.resultsPerPage()) + 1);
  }

  public paginationState(): PaginationState {
    return {
      currentPage: this.current,
      finalPage: this.pageCount(),
      totalCount: this.items.length,
      sliceStart: this.resultsPerPage() * (this.current - 1),
      sliceEnd: this.resultsPerPage() * this.current,
      sequence: paginationSequence(this.current, this.pageCount(), this.nearbyPageCount)
    };
  }

  private pageCount(): number {
    return Math.ceil(this.items.length / this.resultsPerPage()) || 1;
  }

  private pageRange(c: number): {start: number; end: number} {
    return { start: this.resultsPerPage() * (c - 1), end: this.resultsPerPage() * c };
  }

  private itemsOnPage(c: number): T[] {
    const { start, end } = this.pageRange(c);
    return this.items.slice(start, end);
  }

  private wrappedPage(page: number, delta: number, total: number): number {
    return ((page - 1 + delta + total) % total) + 1;
  }
}
