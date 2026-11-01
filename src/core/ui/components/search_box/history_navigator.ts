import { Readable } from "@/core/utils/reactive/signal";

export interface HistoryNavigatorDependencies {
  submittedQueries: Readable<readonly string[]>;
}

export class HistoryNavigator {
  private recalledIndex: number | null = null;
  private typedText = "";

  constructor(private readonly dependencies: HistoryNavigatorDependencies) { }

  public recallOlder(currentText: string): string | undefined {
    const typedText = this.recalledIndex === null ? currentText : this.typedText;
    const olderIndex = this.findRecallableIndex(this.recalledIndex === null ? 0 : this.recalledIndex + 1, 1, typedText);

    if (olderIndex === null) {
      return undefined;
    }
    this.typedText = typedText;
    this.recalledIndex = olderIndex;
    return this.dependencies.submittedQueries.peek()[olderIndex];
  }

  public recallNewer(): string | undefined {
    if (this.recalledIndex === null) {
      return undefined;
    }
    this.recalledIndex = this.findRecallableIndex(this.recalledIndex - 1, -1, this.typedText);
    return this.recalledIndex === null ? this.typedText : this.dependencies.submittedQueries.peek()[this.recalledIndex];
  }

  public stopRecalling(): void {
    this.recalledIndex = null;
  }

  private findRecallableIndex(startIndex: number, step: 1 | -1, typedText: string): number | null {
    const submittedQueries = this.dependencies.submittedQueries.peek();
    let index = startIndex;

    while (index >= 0 && index < submittedQueries.length && submittedQueries[index] === typedText) {
      index += step;
    }
    return index >= 0 && index < submittedQueries.length ? index : null;
  }
}
