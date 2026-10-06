import { AppMode, ColorScheme } from "@/core/boundary/environment";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { Rule34Document } from "@/adapters/rule34/document/document";

export interface Rule34HostPageConfiguration {
  mode: AppMode;
}

export interface Rule34HostPageDependencies {
  rule34Document: Pick<
    Rule34Document,
    "clearNativePage" | "claimPostListContent" | "setHeaderVisible" | "setTheme" | "reflectPostListPage" | "setPaginatorVisible"
  >;
  page: Pick<HostPage, "lockViewport" | "lockScroll" | "unlockScroll"> & { claimContent: () => HTMLElement };
}

const CLAIMS: Record<AppMode, (dependencies: Rule34HostPageDependencies) => HTMLElement> = {
  favorites: ({ rule34Document, page }): HTMLElement => {
    rule34Document.clearNativePage();
    return page.claimContent();
  },
  postList: ({ rule34Document, page }): HTMLElement => rule34Document.claimPostListContent() ?? page.claimContent()
};

export class Rule34HostPage implements HostPage {
  public readonly hasHeader = true;

  constructor(
    private readonly configuration: Rule34HostPageConfiguration,
    private readonly dependencies: Rule34HostPageDependencies
  ) { }

  public setHeaderVisible(visible: boolean): void {
    this.dependencies.rule34Document.setHeaderVisible(visible);
  }

  public setColorScheme(colorScheme: ColorScheme): void {
    this.dependencies.rule34Document.setTheme(colorScheme);
  }

  public reflectSearchPage(pageIndex: number): void {
    this.dependencies.rule34Document.reflectPostListPage(pageIndex);
  }

  public setPaginatorVisible(visible: boolean): void {
    this.dependencies.rule34Document.setPaginatorVisible(visible);
  }

  public claimContent(): HTMLElement {
    return CLAIMS[this.configuration.mode](this.dependencies);
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
