import { AppMode } from "@/core/boundary/environment";
import { Host } from "@/core/boundary/ports";
import { clearNativePage } from "@/adapters/rule34/host/native_page";
import { holdPostPageFetches } from "@/adapters/rule34/client/post_page/post_page";

export class Rule34Host implements Host {
  private readonly takeOvers: Record<AppMode, () => void> = {
    favorites: () => this.takeOverFavoritesPage(),
    posts: () => { }
  };

  constructor(
    private readonly clearPage: () => void = clearNativePage,
    private readonly holdPostPages: () => void = holdPostPageFetches
  ) { }

  public takeOver(mode: AppMode): void {
    this.takeOvers[mode]();
  }

  private takeOverFavoritesPage(): void {
    this.clearPage();
    this.holdPostPages();
  }
}
