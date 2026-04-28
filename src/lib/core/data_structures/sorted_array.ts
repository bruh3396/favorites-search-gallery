/* eslint-disable no-bitwise */
export class SortedArray<T extends | string | number> {
  private array: T[] = [];
  private isSorted: boolean = true;

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

  private sort(): T[] {
    this.isSorted = true;
    return this.array.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  private getSortedIndex(value: T): number {
    let low = 0;
    let high = this.array.length;

    while (low < high) {
      const mid = (low + high) >>> 1;

      if (this.array[mid] < value) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }
}
