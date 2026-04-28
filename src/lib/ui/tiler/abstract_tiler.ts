import { LayoutMode } from "../../../types/common_types";
import { insertStyle } from "../../../utils/dom/injector";

export abstract class AbstractTiler {
  protected readonly container: HTMLElement;
  public readonly abstract layoutMode: LayoutMode;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public get enabled(): boolean {
    return this.container.classList.contains(this.layoutMode);
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
        #${this.container.id}.${this.layoutMode} {
          grid-template-columns: repeat(${columnCount}, 1fr) !important;
        }
        `, `${this.container.id}-${this.layoutMode}-column-count`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setRowSize(rowSize: number): void { }

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
    this.container.classList.add(this.layoutMode);
    this.onActivate();
  }
  public deactivate(): void {
    this.container.classList.remove(this.layoutMode);
    this.onDeactivate();
  }
  protected onActivate(): void {}
  protected onDeactivate(): void {}
}
