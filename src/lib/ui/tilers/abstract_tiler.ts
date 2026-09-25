import { Layout } from "@/types/app";

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

  public reTile(items: HTMLElement[]): boolean {
    return reconcileChildren(this.container, items);
  }

  public setColumnCount(columnCount: number): void {
    this.container.style.setProperty("--tile-columns", String(columnCount));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setRowHeight(rowHeight: number): void { }

  public bottomEdgeElements(): HTMLElement[] {
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

export function reconcileChildren(parent: Element, items: HTMLElement[]): boolean {
  const existing = parent.children;
  const shared = Math.min(existing.length, items.length);

  for (let i = 0; i < shared; i += 1) {
    if (existing[i] !== items[i]) {
      return false;
    }
  }

  for (let i = existing.length - 1; i >= items.length; i -= 1) {
    existing[i].remove();
  }

  if (items.length > existing.length) {
    const fragment = document.createDocumentFragment();

    for (let i = existing.length; i < items.length; i += 1) {
      fragment.appendChild(items[i]);
    }
    parent.appendChild(fragment);
  }
  return true;
}
