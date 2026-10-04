import { AppMode, ColorScheme } from "@/core/boundary/environment";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { Rule34Client } from "@/adapters/rule34/client/client";

const TAKE_OVERS: Record<AppMode, (rule34: Pick<Rule34Client, "clearNativePage">) => void> = {
  favorites: rule34 => rule34.clearNativePage(),
  postList: () => { }
};

export interface Rule34HostPageConfiguration {
  mode: AppMode;
}

export interface Rule34HostPageDependencies {
  rule34: Pick<Rule34Client, "clearNativePage" | "setHeaderVisible" | "setTheme" | "reflectPostListPage" | "setPaginatorVisible">;
  page: Pick<HostPage, "lockViewport" | "lockScroll" | "unlockScroll"> & { claimContent: () => HTMLElement };
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

  public reflectSearchPage(pageIndex: number): void {
    this.dependencies.rule34.reflectPostListPage(pageIndex);
  }

  public setPaginatorVisible(visible: boolean): void {
    this.dependencies.rule34.setPaginatorVisible(visible);
  }

  public claimContent(): HTMLElement {
    TAKE_OVERS[this.configuration.mode](this.dependencies.rule34);
    return this.dependencies.page.claimContent();
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
