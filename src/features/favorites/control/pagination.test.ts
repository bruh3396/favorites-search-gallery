import * as FavoritesPagination from "@/features/favorites/control/pagination";
import { afterEach, describe, expect, test } from "vitest";
import { FavoritesPaginationAction } from "@/features/favorites/types/types";
import { FavoritesPaginationRenderer } from "@/features/favorites/view/pagination_renderer";
import { createEvents } from "@/app/context/events";
import { span } from "@/utils/browser/element";

interface Setup {
  pagination: HTMLElement;
  emitted: string[];
}

function setup(): Setup {
  const events = createEvents();
  const pagination = document.createElement("div");
  const renderer = new FavoritesPaginationRenderer(pagination, span());
  const emitted: string[] = [];

  document.body.append(pagination);
  renderer.render({ currentPage: 1, finalPage: 9, totalCount: 900, sliceStart: 0, sliceEnd: 100, sequence: [1, 2, "ellipsis", 9] });
  events.favorites.pageSelected.on(page => emitted.push(`page ${page}`));
  events.favorites.pageStepped.on(direction => emitted.push(`step ${direction}`));
  events.favorites.gotoPageToggled.on(() => emitted.push("goto toggled"));
  events.favorites.gotoPageSubmitted.on(page => emitted.push(`goto ${page}`));
  FavoritesPagination.setup(events, pagination);
  return { pagination, emitted };
}

function buttonFor(pagination: HTMLElement, action: FavoritesPaginationAction, value?: string): HTMLButtonElement {
  const valueSelector = value === undefined ? "" : `[data-value="${value}"]`;
  return pagination.querySelector(`button[data-action="${action}"]${valueSelector}`) as HTMLButtonElement;
}

function gotoField(pagination: HTMLElement): HTMLInputElement {
  return buttonFor(pagination, "gotoSubmit").parentElement?.querySelector("input") as HTMLInputElement;
}

function click(element: Node): void {
  element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function pressEnter(element: Element): void {
  element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
}

describe("FavoritesPagination", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test("clicking a page number selects that page", () => {
    const { pagination, emitted } = setup();

    click(buttonFor(pagination, "page", "2"));
    expect(emitted).toEqual(["page 2"]);
  });

  test("clicking an arrow, or the icon inside it, steps in its direction", () => {
    const { pagination, emitted } = setup();

    click(buttonFor(pagination, "step", "ArrowRight"));
    click(buttonFor(pagination, "step", "ArrowLeft").firstElementChild as Element);
    expect(emitted).toEqual(["step ArrowRight", "step ArrowLeft"]);
  });

  test("clicking the ellipsis toggles the go-to-page prompt", () => {
    const { pagination, emitted } = setup();

    click(buttonFor(pagination, "gotoToggle"));
    expect(emitted).toEqual(["goto toggled"]);
  });

  test("the go button submits the typed page", () => {
    const { pagination, emitted } = setup();

    gotoField(pagination).value = "7";
    click(buttonFor(pagination, "gotoSubmit"));
    expect(emitted).toEqual(["goto 7"]);
  });

  test("the go button submits the first page when there is no go-to field", () => {
    const { pagination, emitted } = setup();

    gotoField(pagination).remove();
    click(buttonFor(pagination, "gotoSubmit"));
    expect(emitted).toEqual(["goto 1"]);
  });

  test("Enter in the go-to field submits the typed page", () => {
    const { pagination, emitted } = setup();
    const field = gotoField(pagination);

    field.value = "4";
    pressEnter(field);

    expect(emitted).toEqual(["goto 4"]);
  });

  test("ignores clicks and keys that don't land on a control", () => {
    const { pagination, emitted } = setup();

    click(pagination);
    click(buttonFor(pagination, "page", "2").appendChild(document.createTextNode("2")));
    pressEnter(buttonFor(pagination, "page", "2"));
    pagination.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    expect(emitted).toEqual([]);
  });
});
