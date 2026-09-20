import { IconName, icon } from "@/lib/ui/icon";
import { PaginationSequence, PaginationState } from "@/types/ui";
import { Stepper, buildStepper } from "@/lib/ui/settings/components/stepper_control";
import { createElement, label, span } from "@/utils/browser/element";
import { removeDataset, toggleDataset } from "@/utils/browser/dataset";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { doNothing } from "@/utils/pure/function";
import { paginationUpdateStrategy } from "@/lib/ui/pagination";

const PaginationSelectors = {
  containerId: "favorites-pagination",
  rangeIndicatorId: "pagination-range-label",
  numberTraversalButtonClass: "favorites-pagination-btn",
  ellipsisClass: "favorites-pagination-ellipsis",
  arrowClass: "favorites-pagination-arrow",
  headingClass: "goto-page-heading",
  selectedClass: "selected",
  popoverId: "goto-page-popover",
  popoverRowId: "goto-page-row",
  popoverInputId: "goto-page-input",
  popoverButtonId: "goto-page-button"
};

const ArrowTraversalButtons = {
  previous: { id: "previous-page", iconName: "chevronLeft", direction: "ArrowLeft", position: "afterbegin" },
  next: { id: "next-page", iconName: "chevronRight", direction: "ArrowRight", position: "beforeend" }
} as const satisfies Record<string, { id: string; iconName: IconName; direction: NavigationKey; position: InsertPosition }>;

export class FavoritesPaginationRenderer {
  private readonly container = span(PaginationSelectors.containerId);
  private readonly rangeIndicator = label(PaginationSelectors.rangeIndicatorId);
  private onPageSelected: (pageNumber: number) => void = doNothing;
  private onPageStepped: (direction: NavigationKey) => void = doNothing;
  private renderedSequence: PaginationSequence = [];
  private gotoPageStepper: Stepper | null = null;

  constructor(private readonly preferences: Preferences) { }

  public setup(pageSelected: (pageNumber: number) => void, pageStepped: (direction: NavigationKey) => void, paginationSlot: HTMLElement, resultsCount: HTMLElement): void {
    this.onPageSelected = pageSelected;
    this.onPageStepped = pageStepped;
    this.insert(paginationSlot, resultsCount);
    this.buildPaginator({ currentPage: 1, finalPage: 1, totalCount: 0, sliceStart: 0, sliceEnd: 0, sequence: [1] });
    this.togglePaginator(!this.preferences.favorites.infiniteScroll.value);
  }

  public togglePaginator(value: boolean): void {
    toggleDataset(document.documentElement, "paginationHidden", !value);
  }

  public isGotoPagePopoverTarget(target: Node): boolean {
    const popover = this.container.querySelector(`#${PaginationSelectors.popoverId}`);
    const ellipsis = this.container.querySelector(`.${PaginationSelectors.ellipsisClass}`);
    return popover?.contains(target) === true || ellipsis?.contains(target) === true;
  }

  public closeGotoPagePopover(): void {
    removeDataset(this.container.querySelector<HTMLElement>(`#${PaginationSelectors.popoverId}`), "open");
  }

  public buildPaginator(context: PaginationState): void {
    this.container.innerHTML = "";
    this.updateRangeIndicator(context.sliceStart, context.sliceEnd, context.totalCount);
    this.createNumberTraversalButtons(context);
    this.createArrowTraversalButtons(context);
  }

  public updatePaginator(context: PaginationState): void {
    this.updateRangeIndicator(context.sliceStart, context.sliceEnd, context.totalCount);
    this.rebuildNumberTraversalButtons(context);
    this.updateExistingArrowTraversalButtons(context);
  }

  private insertMenu(paginationSlot: HTMLElement): void {
    paginationSlot.insertAdjacentElement("afterend", this.container);
    paginationSlot.remove();
  }

  private insert(paginationSlot: HTMLElement, resultsCount: HTMLElement): void {
    resultsCount.insertAdjacentElement("beforebegin", this.rangeIndicator);
    this.insertMenu(paginationSlot);
  }

  private updateRangeIndicator(start: number, end: number, count: number): void {
    end = Math.min(count, end);
    this.rangeIndicator.textContent = end === 0 ? "" : `${start + 1} - ${end}`;
  }

  private createNumberTraversalButtons(context: PaginationState): void {
    const popover = this.createGotoPagePopover(context.currentPage, context.finalPage);

    this.renderedSequence = context.sequence;

    for (const term of this.renderedSequence) {
      if (term === "ellipsis") {
        this.createEllipsis(popover);
      } else {
        this.createNumberTraversalButton(context.currentPage, term);
      }
    }
    this.container.appendChild(popover);
  }

  private createEllipsis(popover: HTMLElement): void {
    const ellipsis = createElement("button", { className: PaginationSelectors.ellipsisClass, textContent: "…" });

    addTooltip(ellipsis, "Goto specific page", "below");
    ellipsis.onclick = (): void => {
      if (toggleDataset(popover, "open")) {
        popover.querySelector("input")?.select();
      }
    };
    this.container.appendChild(ellipsis);
  }

  private createNumberTraversalButton(currentPageNumber: number, pageNumber: number): void {
    const button = createElement("button", { className: PaginationSelectors.numberTraversalButtonClass });

    this.container.appendChild(button);
    this.assignNumberTraversalButton(button, currentPageNumber, pageNumber);
  }

  private assignNumberTraversalButton(button: HTMLButtonElement, currentPageNumber: number, pageNumber: number): void {
    button.id = `favorites-page-${pageNumber}`;
    button.classList.toggle(PaginationSelectors.selectedClass, currentPageNumber === pageNumber);
    button.textContent = String(pageNumber);
    button.onclick = (): void => {
      this.onPageSelected(pageNumber);
    };
  }

  private rebuildNumberTraversalButtons(context: PaginationState): void {
    const strategy = paginationUpdateStrategy(this.renderedSequence, context.sequence);

    if (strategy === "skip") {
      return;
    }

    if (strategy === "patch") {
      this.patchNumberTraversalButtons(context);
      return;
    }

    for (const element of [...this.container.querySelectorAll(`.${PaginationSelectors.numberTraversalButtonClass}, .${PaginationSelectors.ellipsisClass}, #${PaginationSelectors.popoverId}`)]) {
      element.remove();
    }
    this.createNumberTraversalButtons(context);
  }

  private patchNumberTraversalButtons(context: PaginationState): void {
    const buttons = this.container.querySelectorAll<HTMLButtonElement>(`.${PaginationSelectors.numberTraversalButtonClass}`);
    let buttonIndex = 0;

    for (const term of context.sequence) {
      if (term !== "ellipsis") {
        const button = buttons[buttonIndex];

        if (button !== undefined) {
          this.assignNumberTraversalButton(button, context.currentPage, term);
        }
        buttonIndex += 1;
      }
    }
    this.patchGotoPagePopover(context);
    this.renderedSequence = context.sequence;
  }

  private patchGotoPagePopover(context: PaginationState): void {
    this.gotoPageStepper?.setMax(context.finalPage);
  }

  private createArrowTraversalButtons(context: PaginationState): void {
    const previous = this.createArrowTraversalButton("previous");
    const next = this.createArrowTraversalButton("next");

    this.updateArrowTraversalButtonInteractability(previous, next, context);
  }

  private createArrowTraversalButton(name: keyof typeof ArrowTraversalButtons): HTMLButtonElement {
    const arrow = ArrowTraversalButtons[name];
    const button = createElement("button", {
      id: arrow.id, className: PaginationSelectors.arrowClass, children: [icon(arrow.iconName)]
    });

    addTooltip(button, `Goto ${name} page`, "below");
    button.onclick = (): void => {
      this.onPageStepped(arrow.direction);
    };
    this.container.insertAdjacentElement(arrow.position, button);
    return button;
  }

  private createGotoPagePopover(currentPageNumber: number, finalPageNumber: number): HTMLElement {
    const heading = createElement("label", { className: PaginationSelectors.headingClass, textContent: "Go to page" });
    const button = createElement("button", { id: PaginationSelectors.popoverButtonId, textContent: "Go" });
    const stepper = buildStepper({
      id: PaginationSelectors.popoverInputId, min: 1, max: finalPageNumber, step: 1, value: currentPageNumber, onChange: doNothing
    });
    const row = createElement("div", { id: PaginationSelectors.popoverRowId, children: [stepper.element, button] });
    const popover = createElement("div", { id: PaginationSelectors.popoverId, children: [heading, row] });

    this.gotoPageStepper = stepper;
    const submit = (): void => {
      this.onPageSelected(stepper.value);
      removeDataset(popover, "open");
    };

    button.onclick = submit;
    stepper.element.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        submit();
      }
    });
    return popover;
  }

  private updateExistingArrowTraversalButtons(context: PaginationState): void {
    const previous = this.container.querySelector<HTMLButtonElement>(`#${ArrowTraversalButtons.previous.id}`);
    const next = this.container.querySelector<HTMLButtonElement>(`#${ArrowTraversalButtons.next.id}`);

    if (previous !== null && next !== null) {
      this.updateArrowTraversalButtonInteractability(previous, next, context);
    }
  }

  private updateArrowTraversalButtonInteractability(previousPage: HTMLButtonElement, nextPage: HTMLButtonElement, context: PaginationState): void {
    previousPage.disabled = context.currentPage === 1;
    nextPage.disabled = context.currentPage === context.finalPage;
  }
}
