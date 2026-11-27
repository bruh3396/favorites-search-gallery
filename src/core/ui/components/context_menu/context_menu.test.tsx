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

function setup(
  contextMenuItems: readonly ContextMenuItem[],
  opensOn: "contextmenu" | "click" = "contextmenu",
  onOpenChange?: (isOpen: boolean) => void
): Setup {
  const { result: target, dispose } = render(document, () => (
    <ContextMenu
      target={opensOn === "click" ? <button type="button" /> : <div />}
      opensOn={opensOn}
      listItems={() => contextMenuItems}
      onOpenChange={onOpenChange}
    />
  ));

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

function queryScrim(): HTMLElement {
  return document.querySelector<HTMLElement>(`.${ContextMenuClass.scrim}`)!;
}

function listenOnBody(types: readonly string[]): string[] {
  const reachedTypes: string[] = [];
  const record = (event: Event): void => {
    reachedTypes.push(event.type);
  };

  types.forEach(type => document.body.addEventListener(type, record));
  onTestFinished(() => types.forEach(type => document.body.removeEventListener(type, record)));
  return reachedTypes;
}

function queryItems(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>("[role^=menuitem]")];
}

function clickTarget(target: HTMLElement, detail = 1): void {
  target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail }));
}

function mockLayout(anchorRect: Partial<DOMRect>): void {
  vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(1_000);
  vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(100);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 0, bottom: 0, ...anchorRect } as DOMRect);
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

  test("closes on Escape, Tab, a click outside and the window losing focus", () => {
    const { target } = setup([buildContextMenuItem()]);
    const closed: (HTMLElement | null)[] = [];

    rightClick(target);
    press("Escape");
    closed.push(queryMenu());
    rightClick(target);
    press("Tab");
    closed.push(queryMenu());
    rightClick(target);
    queryScrim().click();
    closed.push(queryMenu());
    rightClick(target);
    window.dispatchEvent(new Event("blur"));
    closed.push(queryMenu());
    expect(closed).toEqual([null, null, null, null]);
  });

  test("keeps pointer input outside it from reaching the page, closing on a click", () => {
    const { target } = setup([buildContextMenuItem()]);
    const reachedTypes = listenOnBody(["pointerdown", "mousedown", "wheel", "click", "auxclick", "contextmenu"]);

    rightClick(target);
    reachedTypes.length = 0;
    const wheel = new WheelEvent("wheel", { bubbles: true, cancelable: true });

    for (const event of [new PointerEvent("pointerdown", { bubbles: true }), new MouseEvent("mousedown", { bubbles: true }), wheel]) {
      queryScrim().dispatchEvent(event);
    }
    const pressing: [string[], boolean, boolean] = [[...reachedTypes], wheel.defaultPrevented, queryMenu() !== null];
    const dismissals: [string[], boolean][] = [];

    for (const type of ["click", "auxclick", "contextmenu"]) {
      rightClick(target);
      reachedTypes.length = 0;
      const event = new MouseEvent(type, { bubbles: true, cancelable: true });

      queryScrim().dispatchEvent(event);
      dismissals.push([[...reachedTypes], queryMenu() === null && event.defaultPrevented]);
    }
    expect([pressing, dismissals]).toEqual([[[], true, true], [[[], true], [[], true], [[], true]]]);
  });

  test("keeps pointer input and keys inside it from reaching the page", () => {
    const { target } = setup([buildContextMenuItem()]);
    const reachedTypes = listenOnBody(["pointerdown", "mousedown", "wheel", "keydown"]);

    rightClick(target);

    for (const type of ["pointerdown", "mousedown", "wheel"]) {
      queryMenu()!.dispatchEvent(new Event(type, { bubbles: true }));
    }
    press("f");
    press("Escape");
    expect(reachedTypes).toEqual([]);
  });

  test("reports opening and closing", () => {
    const onOpenChange: Mock<(isOpen: boolean) => void> = vi.fn();
    const { target } = setup([buildContextMenuItem()], "contextmenu", onOpenChange);

    rightClick(target);
    press("Escape");
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
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

  test("shows an item's icon and shortcut, hiding the shortcut from its name", () => {
    const { target } = setup([buildContextMenuItem({ label: "Download", icon: "download", shortcut: "S" }), buildContextMenuItem({ label: "Copy" })]);

    rightClick(target);
    const [download, copy] = queryItems();
    const shortcut = download.querySelector(`.${ContextMenuClass.shortcut}`)!;

    expect([
      download.querySelector(`.${ContextMenuClass.icon}`) !== null, shortcut.textContent, shortcut.getAttribute("aria-hidden"),
      copy.querySelector(`.${ContextMenuClass.icon}`), copy.textContent
    ]).toEqual([true, "S", "true", null, "Copy"]);
  });

  test("shows a checked item as a checkbox in its state", () => {
    const { target } = setup([buildContextMenuItem({ checked: true }), buildContextMenuItem({ checked: false }), buildContextMenuItem()]);

    rightClick(target);
    const states = queryItems().map(item => [item.getAttribute("role"), item.getAttribute("aria-checked")]);

    expect(states).toEqual([["menuitemcheckbox", "true"], ["menuitemcheckbox", "false"], ["menuitem", null]]);
  });

  test("toggles from its button, marking the button expanded", () => {
    const { target } = setup([buildContextMenuItem()], "click");
    const states: [boolean, string | null][] = [];
    const read = (): void => {
      states.push([queryMenu() !== null, target.getAttribute("aria-expanded")]);
    };

    read();
    clickTarget(target);
    read();
    clickTarget(target);
    read();
    clickTarget(target);
    queryScrim().click();
    read();
    expect([target.getAttribute("aria-haspopup"), states]).toEqual(["menu", [[false, "false"], [true, "true"], [false, "false"], [false, "false"]]]);
  });

  test("leaves a right click to the browser when it opens on a click", () => {
    const { target } = setup([buildContextMenuItem()], "click");

    expect([rightClick(target).defaultPrevented, queryMenu()]).toEqual([false, null]);
  });

  test("activates the first enabled item when its button is pressed from the keyboard, none when clicked", () => {
    const { target } = setup([buildContextMenuItem({ disabled: true }), buildContextMenuItem()], "click");

    clickTarget(target, 0);
    const fromKeyboard = readActiveIndex();

    clickTarget(target, 0);
    clickTarget(target, 1);
    expect([fromKeyboard, readActiveIndex()]).toEqual([1, -1]);
  });

  test("returns focus to its button when it closes", () => {
    const { target } = setup([buildContextMenuItem()], "click");

    clickTarget(target);
    press("Escape");
    expect(document.activeElement).toBe(target);
  });

  test.each<[string, Partial<DOMRect>, [string, string]]>([
    ["below the button, end-aligned", { left: 760, top: 10, right: 800, bottom: 50 }, ["600px", "54px"]],
    ["above a button near the bottom", { left: 760, top: 750, right: 800, bottom: 790 }, ["600px", "646px"]],
    ["start-aligned to a button near the start", { left: 10, top: 750, right: 50, bottom: 790 }, ["10px", "646px"]]
  ])("opens from its button %s", (_case, anchorRect, expected) => {
    const { target } = setup([buildContextMenuItem()], "click");

    mockLayout(anchorRect);
    clickTarget(target);
    expect([queryMenu()!.style.left, queryMenu()!.style.top]).toEqual(expected);
  });

  test("follows its button when the window resizes", () => {
    const { target } = setup([buildContextMenuItem()], "click");

    mockLayout({ left: 760, top: 10, right: 800, bottom: 50 });
    clickTarget(target);
    mockLayout({ left: 560, top: 10, right: 600, bottom: 50 });
    window.dispatchEvent(new Event("resize"));
    expect([queryMenu()!.style.left, queryMenu()!.style.top]).toEqual(["400px", "54px"]);
  });
});
