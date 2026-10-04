import { afterEach, describe, expect, test } from "vitest";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesPaginationRenderer } from "@/features/favorites/view/pagination_renderer";
import { PaginationState } from "@/types/ui";

interface Setup {
  renderer: FavoritesPaginationRenderer;
  container: HTMLElement;
  range: HTMLElement;
}

function setup(state?: Partial<PaginationState>): Setup {
  const container = document.createElement("div");
  const range = document.createElement("span");
  const renderer = new FavoritesPaginationRenderer(container, range);

  document.body.append(container);

  if (state !== undefined) {
    renderer.render(createState(state));
  }
  return { renderer, container, range };
}

function createState(overrides: Partial<PaginationState> = {}): PaginationState {
  return { currentPage: 1, finalPage: 9, totalCount: 900, sliceStart: 0, sliceEnd: 100, sequence: [1, 2, 3, "ellipsis", 9], ...overrides };
}

function readPageLabels(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLButtonElement>("button[data-action=page]")].map(button => button.textContent ?? "");
}

function readSelectedPage(container: HTMLElement): string | undefined {
  const pages = [...container.querySelectorAll<HTMLButtonElement>("button[data-action=page]")];
  return pages.find(button => button.classList.contains("selected"))?.textContent ?? undefined;
}

function readArrowStates(container: HTMLElement): { previous: boolean; next: boolean } {
  const [previous, next] = [...container.querySelectorAll<HTMLButtonElement>("button[data-action=step]")];
  return { previous: !previous.disabled, next: !next.disabled };
}

function queryEllipsis(container: HTMLElement): HTMLElement {
  return container.querySelector("button[data-action=gotoToggle]") as HTMLElement;
}

function queryGotoInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector("input") as HTMLInputElement;
}

function queryPopover(container: HTMLElement): HTMLElement {
  return container.querySelector(`#${FavoritesId.gotoPagePopover}`) as HTMLElement;
}

function isPopoverOpen(container: HTMLElement): boolean {
  return queryPopover(container).dataset.open !== undefined;
}

function typeGotoPage(container: HTMLElement, text: string): string {
  const field = queryGotoInput(container);

  field.value = text;
  field.dispatchEvent(new FocusEvent("blur"));
  return field.value;
}

describe("FavoritesPaginationRenderer", () => {
  afterEach(() => {
    document.body.replaceChildren();
    delete document.documentElement.dataset.paginationHidden;
  });

  describe("render", () => {
    test("starts with a single page and no range", () => {
      const { container, range } = setup();

      expect(readPageLabels(container)).toEqual(["1"]);
      expect(readArrowStates(container)).toEqual({ previous: false, next: false });
      expect(range.textContent).toBe("");
    });

    test("draws each page, the gaps between them, and marks the current page", () => {
      const { container } = setup({ currentPage: 2 });

      expect(readPageLabels(container)).toEqual(["1", "2", "3", "9"]);
      expect(readSelectedPage(container)).toBe("2");
      expect(queryEllipsis(container).textContent).toBe("...");
    });

    test("shows the range of favorites on the page, ending at the last favorite", () => {
      const { range } = setup({ sliceStart: 100, sliceEnd: 200 });
      const last = setup({ sliceStart: 850, sliceEnd: 900, totalCount: 870 });

      expect(range.textContent).toBe("101 - 200");
      expect(last.range.textContent).toBe("851 - 870");
    });

    test.each<[number, { previous: boolean; next: boolean }]>([
      [1, { previous: false, next: true }],
      [5, { previous: true, next: true }],
      [9, { previous: true, next: false }]
    ])("on page %i the arrows are %o", (currentPage, arrows) => {
      const { container } = setup({ currentPage });

      expect(readArrowStates(container)).toEqual(arrows);
    });

    test("starts the go-to field at the current page and stops it at the last page", () => {
      const { container } = setup({ currentPage: 3 });

      expect(queryGotoInput(container).value).toBe("3");
      expect(typeGotoPage(container, "50")).toBe("9");
    });

    test("closes the go-to prompt when moving to another page", () => {
      const { renderer, container } = setup(createState());

      renderer.toggleGotoPagePopover();
      renderer.render(createState({ currentPage: 5, sequence: [1, "ellipsis", 4, 5, 6, "ellipsis", 9] }));
      expect(isPopoverOpen(container)).toBe(false);
      expect(queryGotoInput(container).value).toBe("5");
    });
  });

  describe("togglePaginator", () => {
    test("hides and shows the paginator", () => {
      const { renderer } = setup();

      renderer.togglePaginator(false);
      expect(document.documentElement.dataset.paginationHidden).toBeDefined();
      renderer.togglePaginator(true);
      expect(document.documentElement.dataset.paginationHidden).toBeUndefined();
    });
  });

  describe("toggleGotoPagePopover", () => {
    test("opens the go-to-page prompt with the field selected, then closes it", () => {
      const { renderer, container } = setup(createState());
      const field = queryGotoInput(container);

      renderer.toggleGotoPagePopover();
      expect(isPopoverOpen(container)).toBe(true);
      expect(field.selectionEnd).toBe(field.value.length);
      renderer.toggleGotoPagePopover();
      expect(isPopoverOpen(container)).toBe(false);
    });
  });

  describe("closeGotoPagePopover", () => {
    test("closes the go-to-page prompt", () => {
      const { renderer, container } = setup(createState());

      renderer.toggleGotoPagePopover();
      renderer.closeGotoPagePopover();
      expect(isPopoverOpen(container)).toBe(false);
    });
  });

  describe("isGotoPagePopoverTarget", () => {
    test("counts the prompt and the ellipsis as targets, but not pages", () => {
      const { renderer, container } = setup(createState());

      expect(renderer.isGotoPagePopoverTarget(queryGotoInput(container))).toBe(true);
      expect(renderer.isGotoPagePopoverTarget(queryEllipsis(container))).toBe(true);
      expect(renderer.isGotoPagePopoverTarget(container.querySelector("button[data-action=page]") as Node)).toBe(false);
    });

    test("counts only the prompt without an ellipsis", () => {
      const { renderer, container } = setup(createState({ sequence: [1, 2] }));

      expect(renderer.isGotoPagePopoverTarget(queryPopover(container))).toBe(true);
      expect(renderer.isGotoPagePopoverTarget(container)).toBe(false);
    });
  });

  describe("updatePaginator", () => {
    test("renumbers the pages without disturbing someone typing a page to go to", () => {
      const { renderer, container, range } = setup(createState());
      const field = queryGotoInput(container);

      renderer.toggleGotoPagePopover();
      field.focus();
      field.value = "7";
      renderer.updatePaginator(createState({ finalPage: 12, sliceStart: 50, sliceEnd: 100, sequence: [1, 2, 3, "ellipsis", 12] }));
      expect(readPageLabels(container)).toEqual(["1", "2", "3", "12"]);
      expect(range.textContent).toBe("51 - 100");
      expect(document.activeElement).toBe(field);
      expect(field.value).toBe("7");
      expect(isPopoverOpen(container)).toBe(true);
    });

    test("redraws the pages when their shape changes, keeping the arrows at the ends", () => {
      const { renderer, container } = setup(createState());

      renderer.updatePaginator(createState({ currentPage: 2, finalPage: 3, sequence: [1, 2, 3] }));
      expect(readPageLabels(container)).toEqual(["1", "2", "3"]);
      expect(queryEllipsis(container)).toBeNull();
      expect(container.firstElementChild?.id).toBe("previous-page");
      expect(container.lastElementChild?.id).toBe("next-page");
    });

    test("stops the go-to field at the new last page", () => {
      const { renderer, container } = setup(createState());

      renderer.updatePaginator(createState({ finalPage: 4, sequence: [1, 2, 3, 4] }));
      expect(typeGotoPage(container, "50")).toBe("4");
    });

    test("drops the go-to field to the new last page when it was past it", () => {
      const { renderer, container } = setup(createState({ currentPage: 9 }));

      renderer.updatePaginator(createState({ currentPage: 9, finalPage: 4, sequence: [1, 2, 3, 4] }));
      expect(queryGotoInput(container).value).toBe("4");
    });

    test("updates the arrows", () => {
      const { renderer, container } = setup(createState());

      renderer.updatePaginator(createState({ currentPage: 9, sequence: [1, "ellipsis", 7, 8, 9] }));
      expect(readArrowStates(container)).toEqual({ previous: true, next: false });
    });
  });
});
