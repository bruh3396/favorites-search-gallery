import { AppMode, ColorScheme } from "@/core/boundary/environment";
import { HostPage } from "@/core/boundary/ports/host_page";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";

const TAKE_OVERS: Record<AppMode, (rule34: Pick<Rule34SiteClient, "clearNativePage">) => void> = {
  favorites: (rule34) => rule34.clearNativePage(),
  postList: () => { }
};

export interface Rule34HostPageConfiguration {
  mode: AppMode;
}

export interface Rule34HostPageDependencies {
  rule34: Pick<Rule34SiteClient, "clearNativePage" | "setHeaderVisible" | "setTheme">;
  page: Pick<HostPage, "lockViewport" | "lockScroll" | "unlockScroll">;
}

export class Rule34HostPage implements HostPage {
  public readonly hasHeader = true;

  constructor(
    private readonly configuration: Rule34HostPageConfiguration,
    private readonly dependencies: Rule34HostPageDependencies
  ) { }

  public setHeaderVisible(visible: boolean): void {
    this.dependencies.rule34.setHeaderVisible(visible);
  }

  public setColorScheme(colorScheme: ColorScheme): void {
    this.dependencies.rule34.setTheme(colorScheme);
  }

  public clearContent(): void {
    TAKE_OVERS[this.configuration.mode](this.dependencies.rule34);
  }

  public lockViewport(): void {
    this.dependencies.page.lockViewport();
  }

  public lockScroll(): void {
    this.dependencies.page.lockScroll();
  }

  public unlockScroll(): void {
    this.dependencies.page.unlockScroll();
  }
}
