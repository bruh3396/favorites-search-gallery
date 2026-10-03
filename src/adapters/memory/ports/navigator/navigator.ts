import { Navigator } from "@/core/boundary/ports/navigator";

export class MemoryNavigator implements Navigator {
  public readonly opened: string[] = [];

  public open(url: string): void {
    this.opened.push(url);
  }
}
