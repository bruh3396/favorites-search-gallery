import { Layout } from "@/types/ui";
import { insertStyle } from "@/utils/dom/injector";

export abstract class AbstractTiler {
  protected readonly container: HTMLElement;
  public readonly abstract layout: Layout;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public get enabled(): boolean {
    return this.container.dataset.layout === this.layout;
  }

  public get disabled(): boolean {
    return !this.enabled;
  }

  public tile(items: HTMLElement[]): void {
    const fragment = document.createDocumentFragment();

    for (const item of items) {
      fragment.appendChild(item);
    }
    this.container.innerHTML = "";
    this.container.appendChild(fragment);
  }

  public setColumnCount(columnCount: number): void {
    insertStyle(`
        #${this.container.id}[data-layout="${this.layout}"] {
          grid-template-columns: repeat(${columnCount}, 1fr) !important;
        }
        `, `${this.container.id}-${this.layout}-column-count`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setRowSize(rowSize: number): void { }

  public getBottomEdgeElements(): HTMLElement[] {
    return [];
  }

  public addItemsToTop(items: HTMLElement[]): void {
    for (const item of items.reverse()) {
      this.container.insertAdjacentElement("afterbegin", item);
    }
  }

  public addItemsToBottom(items: HTMLElement[]): void {
    for (const item of items) {
      this.container.appendChild(item);
    }
  }

  public activate(): void {
    this.container.dataset.layout = this.layout;
    this.onActivate();
  }
  public deactivate(): void {
    if (this.container.dataset.layout === this.layout) {
      delete this.container.dataset.layout;
    }
    this.onDeactivate();
  }

  protected onActivate(): void {}
  protected onDeactivate(): void {}
}
