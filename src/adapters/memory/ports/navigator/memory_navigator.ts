import { Navigator } from "@/core/boundary/ports/navigator/navigator";

export class MemoryNavigator implements Navigator {
  public readonly opened: string[] = [];

  public open(url: string): void {
    this.opened.push(url);
  }
}
