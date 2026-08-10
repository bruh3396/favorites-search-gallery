import { removeDataset, setDataset } from "@/utils/dom/dataset";

export class ElementPool {
  private readonly elements: HTMLElement[];
  private visibleIndex: number = 0;

  constructor(size: number, create: (index: number) => HTMLElement) {
    this.elements = Array.from({ length: size }, (_, index) => create(index));
  }

  public get current(): HTMLElement {
    return this.elements[this.visibleIndex];
  }

  public get next(): HTMLElement {
    return this.elements[this.nextIndex];
  }

  public get all(): HTMLElement[] {
    return this.elements;
  }

  public get isVisible(): boolean {
    return this.current.dataset.visible !== undefined;
  }

  private get nextIndex(): number {
    return (this.visibleIndex + 1) % this.elements.length;
  }

  public reveal(): HTMLElement {
    removeDataset(this.current, "visible");
    this.visibleIndex = this.nextIndex;
    setDataset(this.current, "visible");
    return this.current;
  }

  public hide(): void {
    for (const element of this.elements) {
      removeDataset(element, "visible");
    }
  }
}
