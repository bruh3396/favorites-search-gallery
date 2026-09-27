import { IconName, icon } from "@/lib/ui/icon";
import { Stepper, buildStepper } from "@/lib/ui/settings/components/stepper_control";
import { removeDataset, toggleDataset } from "@/utils/browser/dataset";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesPaginationAction } from "@/features/favorites/types/types";
import { NavigationKey } from "@/types/input";
import { PaginationState } from "@/types/ui";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/browser/element";
import { doNothing } from "@/utils/pure/function";

const PaginationSelectors = {
  numberTraversalButtonClass: "favorites-pagination-btn",
  ellipsisClass: "favorites-pagination-ellipsis",
  arrowClass: "favorites-pagination-arrow",
  headingClass: "goto-page-heading",
  selectedClass: "selected",
  popoverRowId: "goto-page-row",
  popoverButtonId: "goto-page-button"
};

const ArrowTraversalButtons = {
  previous: { id: "previous-page", iconName: "chevronLeft", direction: "ArrowLeft" },
  next: { id: "next-page", iconName: "chevronRight", direction: "ArrowRight" }
} as const satisfies Record<string, { id: string; iconName: IconName; direction: NavigationKey }>;

export class FavoritesPaginationRenderer {
  private readonly pageButtons: HTMLButtonElement[];
  private readonly ellipses: HTMLButtonElement[];
  private readonly gotoPageStepper: Stepper;
  private readonly gotoPagePopover: HTMLElement;
  private readonly previousPageButton: HTMLButtonElement;
  private readonly nextPageButton: HTMLButtonElement;

  constructor(private readonly container: HTMLElement, private readonly rangeIndicator: HTMLElement) {
    this.pageButtons = [];
    this.ellipses = [];
    this.gotoPageStepper = buildStepper({ id: FavoritesId.gotoPageInput, min: 1, max: 1, step: 1, value: 1, onChange: doNothing });
    this.gotoPagePopover = createGotoPagePopover(this.gotoPageStepper);
    this.previousPageButton = createArrowTraversalButton("previous");
    this.nextPageButton = createArrowTraversalButton("next");
    this.render({ currentPage: 1, finalPage: 1, totalCount: 0, sliceStart: 0, sliceEnd: 0, sequence: [1] });
  }

  public togglePaginator(value: boolean): void {
    toggleDataset(document.documentElement, "paginationHidden", !value);
  }

  public isGotoPagePopoverTarget(target: Node): boolean {
    return this.gotoPagePopover.contains(target) || this.ellipses.some(ellipsis => ellipsis.contains(target));
  }

  public toggleGotoPagePopover(): void {
    if (toggleDataset(this.gotoPagePopover, "open")) {
      this.gotoPagePopover.querySelector("input")?.select();
    }
  }

  public closeGotoPagePopover(): void {
    removeDataset(this.gotoPagePopover, "open");
  }

  public render(context: PaginationState): void {
    this.updatePaginator(context);
    this.gotoPageStepper.setValue(context.currentPage);
    this.closeGotoPagePopover();
  }

  public updatePaginator(context: PaginationState): void {
    this.updateRangeIndicator(context.sliceStart, context.sliceEnd, context.totalCount);
    this.arrange([this.previousPageButton, ...this.assignTerms(context), this.gotoPagePopover, this.nextPageButton]);
    this.gotoPageStepper.setMax(context.finalPage);
    this.previousPageButton.disabled = context.currentPage === 1;
    this.nextPageButton.disabled = context.currentPage === context.finalPage;
  }

  private updateRangeIndicator(start: number, end: number, count: number): void {
    end = Math.min(count, end);
    this.rangeIndicator.textContent = end === 0 ? "" : `${start + 1} - ${end}`;
  }

  private assignTerms({ sequence, currentPage }: PaginationState): HTMLButtonElement[] {
    return sequence.map((term, index) => (term === "ellipsis" ? this.ellipsisAt(index) : this.pageButtonAt(index, currentPage, term)));
  }

  private ellipsisAt(index: number): HTMLButtonElement {
    this.ellipses[index] ??= createEllipsis();
    return this.ellipses[index];
  }

  private pageButtonAt(index: number, currentPage: number, page: number): HTMLButtonElement {
    this.pageButtons[index] ??= createElement("button", { className: PaginationSelectors.numberTraversalButtonClass });
    assignPageButton(this.pageButtons[index], currentPage, page);
    return this.pageButtons[index];
  }

  private arrange(elements: HTMLElement[]): void {
    const { children } = this.container;

    if (children.length !== elements.length || elements.some((element, index) => children[index] !== element)) {
      this.container.replaceChildren(...elements);
    }
  }
}

function assignPageButton(button: HTMLButtonElement, currentPageNumber: number, pageNumber: number): void {
  button.id = `favorites-page-${pageNumber}`;
  button.classList.toggle(PaginationSelectors.selectedClass, currentPageNumber === pageNumber);
  button.textContent = String(pageNumber);
  setAction(button, "page", String(pageNumber));
}

function createEllipsis(): HTMLButtonElement {
  const ellipsis = createElement("button", { className: PaginationSelectors.ellipsisClass, textContent: "..." });

  setAction(ellipsis, "gotoToggle");
  addTooltip(ellipsis, "Goto specific page", "below");
  return ellipsis;
}

function createArrowTraversalButton(name: keyof typeof ArrowTraversalButtons): HTMLButtonElement {
  const arrow = ArrowTraversalButtons[name];
  const button = createElement("button", {
    id: arrow.id, className: PaginationSelectors.arrowClass, children: [icon(arrow.iconName)]
  });

  setAction(button, "step", arrow.direction);
  addTooltip(button, `Goto ${name} page`, "below");
  return button;
}

function createGotoPagePopover(stepper: Stepper): HTMLElement {
  const heading = createElement("label", { className: PaginationSelectors.headingClass, textContent: "Go to page" });
  const button = createElement("button", { id: PaginationSelectors.popoverButtonId, textContent: "Go" });
  const row = createElement("div", { id: PaginationSelectors.popoverRowId, children: [stepper.element, button] });

  setAction(button, "gotoSubmit");
  return createElement("div", { id: FavoritesId.gotoPagePopover, children: [heading, row] });
}

function setAction(button: HTMLButtonElement, action: FavoritesPaginationAction, value = ""): void {
  button.dataset.action = action;
  button.dataset.value = value;
}
