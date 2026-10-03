import { Navigator } from "@/core/boundary/ports/navigator";

export class BrowserNavigator implements Navigator {
  public open(url: string): void {
    window.open(url, "_blank");
  }
}
