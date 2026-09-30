import { AppMode, ColorScheme } from "@/core/boundary/environment";
import { HostPage } from "@/core/boundary/ports/host_page";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";

type Rule34 = Pick<Rule34SiteClient, "clearNativePage" | "setHeaderVisible" | "setTheme">;
type Page = Pick<HostPage, "lockViewport" | "lockScroll" | "unlockScroll">;

const TAKE_OVERS: Record<AppMode, (rule34: Rule34) => void> = {
  favorites: (rule34) => rule34.clearNativePage(),
  postList: () => { }
};

export class Rule34HostPage implements HostPage {
  public readonly hasHeader = true;

  constructor(private readonly rule34: Rule34, private readonly page: Page, private readonly mode: AppMode) { }

  public setHeaderVisible(visible: boolean): void {
    this.rule34.setHeaderVisible(visible);
  }

  public setColorScheme(colorScheme: ColorScheme): void {
    this.rule34.setTheme(colorScheme);
  }

  public clearContent(): void {
    TAKE_OVERS[this.mode](this.rule34);
  }

  public lockViewport(): void {
    this.page.lockViewport();
  }

  public lockScroll(): void {
    this.page.lockScroll();
  }

  public unlockScroll(): void {
    this.page.unlockScroll();
  }
}
