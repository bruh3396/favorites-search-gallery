import { IconName, icon } from "@/lib/ui/icon";
import { PaginationSequence, PaginationState } from "@/types/ui";
import { Stepper, buildStepper } from "@/lib/ui/settings/components/stepper_control";
import { removeDataset, toggleDataset } from "@/utils/browser/dataset";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesPaginationAction } from "@/features/favorites/types/types";
import { NavigationKey } from "@/types/input";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/browser/element";
import { doNothing } from "@/utils/pure/function";
import { paginationUpdateStrategy } from "@/lib/ui/pagination";

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
  previous: { id: "previous-page", iconName: "chevronLeft", direction: "ArrowLeft", position: "afterbegin" },
  next: { id: "next-page", iconName: "chevronRight", direction: "ArrowRight", position: "beforeend" }
} as const satisfies Record<string, { id: string; iconName: IconName; direction: NavigationKey; position: InsertPosition }>;

export class FavoritesPaginationRenderer {
  private renderedSequence: PaginationSequence;
  private gotoPageStepper: Stepper | null;

  constructor(private readonly container: HTMLElement, private readonly rangeIndicator: HTMLElement) {
    this.renderedSequence = [];
    this.gotoPageStepper = null;
    this.buildPaginator({ currentPage: 1, finalPage: 1, totalCount: 0, sliceStart: 0, sliceEnd: 0, sequence: [1] });
  }

  public togglePaginator(value: boolean): void {
    toggleDataset(document.documentElement, "paginationHidden", !value);
  }

  public isGotoPagePopoverTarget(target: Node): boolean {
    const popover = this.container.querySelector(`#${FavoritesId.gotoPagePopover}`);
    const ellipsis = this.container.querySelector(`.${PaginationSelectors.ellipsisClass}`);
    return popover?.contains(target) === true || ellipsis?.contains(target) === true;
  }

  public toggleGotoPagePopover(): void {
    const popover = this.container.querySelector<HTMLElement>(`#${FavoritesId.gotoPagePopover}`);

    if (popover !== null && toggleDataset(popover, "open")) {
      popover.querySelector("input")?.select();
    }
  }

  public closeGotoPagePopover(): void {
    removeDataset(this.container.querySelector<HTMLElement>(`#${FavoritesId.gotoPagePopover}`), "open");
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

  private updateRangeIndicator(start: number, end: number, count: number): void {
    end = Math.min(count, end);
    this.rangeIndicator.textContent = end === 0 ? "" : `${start + 1} - ${end}`;
  }

  private createNumberTraversalButtons(context: PaginationState): void {
    const popover = this.createGotoPagePopover(context.currentPage, context.finalPage);

    this.renderedSequence = context.sequence;

    for (const term of this.renderedSequence) {
      if (term === "ellipsis") {
        this.createEllipsis();
      } else {
        this.createNumberTraversalButton(context.currentPage, term);
      }
    }
    this.container.appendChild(popover);
  }

  private createEllipsis(): void {
    const ellipsis = createElement("button", { className: PaginationSelectors.ellipsisClass, textContent: "..." });

    setAction(ellipsis, "gotoToggle");
    addTooltip(ellipsis, "Goto specific page", "below");
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
    setAction(button, "page", String(pageNumber));
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

    for (const element of [...this.container.querySelectorAll(`.${PaginationSelectors.numberTraversalButtonClass}, .${PaginationSelectors.ellipsisClass}, #${FavoritesId.gotoPagePopover}`)]) {
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

    setAction(button, "step", arrow.direction);
    addTooltip(button, `Goto ${name} page`, "below");
    this.container.insertAdjacentElement(arrow.position, button);
    return button;
  }

  private createGotoPagePopover(currentPageNumber: number, finalPageNumber: number): HTMLElement {
    const heading = createElement("label", { className: PaginationSelectors.headingClass, textContent: "Go to page" });
    const button = createElement("button", { id: PaginationSelectors.popoverButtonId, textContent: "Go" });
    const stepper = buildStepper({
      id: FavoritesId.gotoPageInput, min: 1, max: finalPageNumber, step: 1, value: currentPageNumber, onChange: doNothing
    });
    const row = createElement("div", { id: PaginationSelectors.popoverRowId, children: [stepper.element, button] });

    this.gotoPageStepper = stepper;
    setAction(button, "gotoSubmit");
    return createElement("div", { id: FavoritesId.gotoPagePopover, children: [heading, row] });
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

function setAction(button: HTMLButtonElement, action: FavoritesPaginationAction, value = ""): void {
  button.dataset.action = action;
  button.dataset.value = value;
}
