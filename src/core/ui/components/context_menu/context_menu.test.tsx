import { ContextMenu, ContextMenuClass } from "@/core/ui/components/context_menu/context_menu";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import CONTEXT_MENU_CSS from "@/core/ui/components/context_menu/context_menu.css?inline";
import { ContextMenuItem } from "@/core/ui/components/context_menu/context_menu_item";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  target: HTMLElement;
  dispose: () => void;
}

function buildContextMenuItem(partialContextMenuItem: Partial<ContextMenuItem> = {}): ContextMenuItem {
  return { label: "Item", onChoose: vi.fn(), ...partialContextMenuItem };
}

function setup(contextMenuItems: readonly ContextMenuItem[]): Setup {
  const { result: target, dispose } = render(document, () => <ContextMenu target={<div />} listItems={() => contextMenuItems} />);

  document.body.append(target);
  onTestFinished(() => {
    dispose();
    target.remove();
    vi.restoreAllMocks();
  });
  return { target, dispose };
}

function rightClick(target: HTMLElement, clientX = 0, clientY = 0): MouseEvent {
  const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX, clientY });

  target.dispatchEvent(event);
  return event;
}

function queryMenu(): HTMLElement | null {
  return document.querySelector("[role=menu]");
}

function queryItems(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>("[role=menuitem]")];
}

function press(key: string): void {
  queryMenu()!.dispatchEvent(new KeyboardEvent("keydown", { key, cancelable: true }));
}

function readActiveIndex(): number {
  return queryItems().findIndex(item => item === queryMenu()!.ariaActiveDescendantElement);
}

describe("ContextMenu", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(ContextMenuClass, CONTEXT_MENU_CSS);
  });

  test("opens on a right click in place of the browser's menu", () => {
    const { target } = setup([buildContextMenuItem({ label: "Close" }), buildContextMenuItem({ label: "Close All", startsGroup: true })]);
    const event = rightClick(target);

    expect([event.defaultPrevented, queryItems().map(item => [item.textContent, item.dataset.startsGroup])])
      .toEqual([true, [["Close", "false"], ["Close All", "true"]]]);
  });

  test("leaves a right click with no items to the browser", () => {
    const { target } = setup([]);
    const event = rightClick(target);

    expect([event.defaultPrevented, queryMenu()]).toEqual([false, null]);
  });

  test("chooses a clicked item and closes", () => {
    const onChoose: Mock<() => void> = vi.fn();
    const { target } = setup([buildContextMenuItem({ onChoose })]);

    rightClick(target);
    queryItems()[0].click();
    expect([onChoose.mock.calls.length, queryMenu()]).toEqual([1, null]);
  });

  test("ignores a disabled item and stays open", () => {
    const onChoose: Mock<() => void> = vi.fn();
    const { target } = setup([buildContextMenuItem({ onChoose, disabled: true })]);

    rightClick(target);
    queryItems()[0].click();
    expect([queryItems()[0].getAttribute("aria-disabled"), onChoose.mock.calls.length, queryMenu() !== null]).toEqual(["true", 0, true]);
  });

  test("moves with the arrow keys past disabled items, wrapping, and chooses with Enter", () => {
    const onChoose: Mock<() => void> = vi.fn();
    const { target } = setup([buildContextMenuItem({ onChoose }), buildContextMenuItem({ disabled: true }), buildContextMenuItem()]);
    const actives: number[] = [];

    rightClick(target);

    for (const key of ["ArrowUp", "ArrowUp", "ArrowDown", "a", "End", "Home"]) {
      press(key);
      actives.push(readActiveIndex());
    }
    press("Enter");
    expect([actives, onChoose.mock.calls.length, queryMenu()]).toEqual([[2, 0, 2, 2, 2, 0], 1, null]);
  });

  test("chooses the active item with Space", () => {
    const onChoose: Mock<() => void> = vi.fn();
    const { target } = setup([buildContextMenuItem({ onChoose })]);

    rightClick(target);
    press(" ");
    const chosenBeforeMoving = onChoose.mock.calls.length;

    press("ArrowDown");
    press(" ");
    expect([chosenBeforeMoving, onChoose.mock.calls.length]).toEqual([0, 1]);
  });

  test("activates nothing when every item is disabled", () => {
    const { target } = setup([buildContextMenuItem({ disabled: true })]);

    rightClick(target);
    press("ArrowDown");
    press("Enter");
    expect([readActiveIndex(), queryMenu() !== null]).toEqual([-1, true]);
  });

  test("follows the pointer over its items until it leaves", () => {
    const { target } = setup([buildContextMenuItem(), buildContextMenuItem()]);

    rightClick(target);
    queryItems()[1].dispatchEvent(new PointerEvent("pointermove"));
    queryItems()[1].dispatchEvent(new PointerEvent("pointermove"));
    const hovered = readActiveIndex();

    queryMenu()!.dispatchEvent(new PointerEvent("pointerleave"));
    expect([hovered, readActiveIndex()]).toEqual([1, -1]);
  });

  test("keeps the browser's menu off a right click on itself", () => {
    const { target } = setup([buildContextMenuItem()]);

    rightClick(target);
    const event = rightClick(queryMenu()!);

    expect([event.defaultPrevented, queryMenu() !== null]).toEqual([true, true]);
  });

  test("closes on Escape, Tab and a press outside", () => {
    const { target } = setup([buildContextMenuItem()]);
    const closed: (HTMLElement | null)[] = [];

    rightClick(target);
    press("Escape");
    closed.push(queryMenu());
    rightClick(target);
    press("Tab");
    closed.push(queryMenu());
    rightClick(target);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    closed.push(queryMenu());
    expect(closed).toEqual([null, null, null]);
  });

  test("stays open on a press inside it", () => {
    const { target } = setup([buildContextMenuItem()]);

    rightClick(target);
    queryMenu()!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    expect(queryMenu()).not.toBeNull();
  });

  test("opens at the pointer, flipped to stay inside the viewport", () => {
    const { target } = setup([buildContextMenuItem()]);

    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(1_000);
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(800);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(100);
    rightClick(target, 100, 50);
    const near = [queryMenu()!.style.left, queryMenu()!.style.top];

    rightClick(target, 900, 750);
    expect([near, [queryMenu()!.style.left, queryMenu()!.style.top]]).toEqual([["100px", "50px"], ["700px", "650px"]]);
  });

  test("takes focus while open and returns it when it closes", () => {
    const { target } = setup([buildContextMenuItem()]);
    const button = document.createElement("button");

    target.append(button);
    button.focus();
    rightClick(target);
    const isMenuFocused = document.activeElement === queryMenu();

    press("Escape");
    expect([isMenuFocused, document.activeElement === button]).toEqual([true, true]);
  });

  test("closes when disposed", () => {
    const { target, dispose } = setup([buildContextMenuItem()]);

    rightClick(target);
    dispose();
    expect(queryMenu()).toBeNull();
  });
});
