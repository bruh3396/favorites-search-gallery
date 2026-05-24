type Comparator<T> = (a: T, b: T) => number;
const defaultCompare = <T>(a: T, b: T): number => (a < b ? -1 : a > b ? 1 : 0);

export class SortedArray<T> {
  private readonly array: T[] = [];
  private readonly compare: Comparator<T>;
  private isSorted: boolean = true;

  constructor(compare?: Comparator<T>) {
    this.compare = compare ?? (defaultCompare as Comparator<T>);
  }

  public get length(): number {
    return this.array.length;
  }

  public toArray(): T[] {
    return this.isSorted ? this.array : this.sort();
  }

  public insert(value: T): void {
    this.array.splice(this.getSortedIndex(value), 0, value);
  }

  public push(value: T): void {
    this.isSorted = false;
    this.array.push(value);
  }

  public first(): T | undefined {
    if (!this.isSorted) {
      this.sort();
    }
    return this.array[0];
  }

  public shift(): T | undefined {
    if (!this.isSorted) {
      this.sort();
    }
    return this.array.shift();
  }

  public remove(value: T): boolean {
    const index = this.isSorted ? this.findSortedIndex(value) : this.array.indexOf(value);

    if (index === -1) {
      return false;
    }
    this.array.splice(index, 1);
    return true;
  }

  public sort(): T[] {
    this.isSorted = true;
    return this.array.sort(this.compare);
  }

  private findSortedIndex(value: T): number {
    const index = this.getSortedIndex(value);

    if (index < this.array.length && this.compare(this.array[index], value) === 0) {
      return index;
    }
    return -1;
  }

  private getSortedIndex(value: T): number {
    let low = 0;
    let high = this.array.length;

    while (low < high) {
      const mid = (low + high) >>> 1;

      if (this.compare(this.array[mid], value) < 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }
}
