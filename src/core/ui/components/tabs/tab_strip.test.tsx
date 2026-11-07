import { Mock, afterEach, describe, expect, test, vi } from "vitest";
import { TabStrip, TabStripClass, TabStripItem } from "@/core/ui/components/tabs/tab_strip";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import TAB_STRIP_CSS from "@/core/ui/components/tabs/tab_strip.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  element: HTMLElement;
  tabs: Signal<readonly TabStripItem[]>;
  activeTabId: Signal<string | null>;
  onActivate: Mock<(tabId: string) => void>;
  onClose: Mock<(tabId: string) => void>;
  onMove: Mock<(tabId: string, index: number) => void>;
  onAdd: Mock<() => void>;
  onCloseAll: Mock<() => void>;
}

function createTab(tabId: string, { closable = true }: { closable?: boolean } = {}): TabStripItem {
  return { id: tabId, label: new Signal(tabId), closable };
}

function setup(
  tabStripItems: readonly TabStripItem[] = [createTab("Home", { closable: false }), createTab("apple")],
  activeTabId: string | null = "Home"
): Setup {
  const options = {
    tabs: new Signal(tabStripItems),
    activeTabId: new Signal(activeTabId),
    onActivate: vi.fn<(tabId: string) => void>(),
    onClose: vi.fn<(tabId: string) => void>(),
    onMove: vi.fn<(tabId: string, index: number) => void>(),
    onAdd: vi.fn<() => void>(),
    onCloseAll: vi.fn<() => void>()
  };
  const { result: element } = render(document, () => <TabStrip {...options} />);

  document.body.append(element);
  return { ...options, element };
}

function findTab(element: HTMLElement, label: string): HTMLButtonElement {
  return [...element.querySelectorAll<HTMLButtonElement>("[role=tab]")].find(tab => tab.querySelector(`.${TabStripClass.label}`)?.textContent === label)!;
}

function findCloseButton(element: HTMLElement, label: string): HTMLButtonElement | null {
  return element.querySelector<HTMLButtonElement>(`button[aria-label="Close ${label}"]`);
}

function findTabList(element: HTMLElement): HTMLElement {
  return element.querySelector<HTMLElement>("[role=tablist]")!;
}

function makeScrollable(list: HTMLElement, scrollLeft = 0): void {
  Object.defineProperty(list, "scrollLeft", { value: scrollLeft, writable: true });
}

function placeTab(element: HTMLElement, label: string, bounds: Pick<DOMRect, "left" | "right">): void {
  findTab(element, label).parentElement!.getBoundingClientRect = (): DOMRect => bounds as DOMRect;
}

interface Drop {
  draggedTabId: string;
  clientX: number;
  type?: string;
}

function dropOn(element: HTMLElement, label: string, { draggedTabId, clientX, type = "drop" }: Drop): DragEvent {
  const target = findTab(element, label).parentElement!;
  const dataTransfer = new DataTransfer();
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX }) as DragEvent;

  Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
  dataTransfer.setData("application/x-fsg-tab", draggedTabId);
  target.getBoundingClientRect = (): DOMRect => ({ left: 0, width: 100 }) as DOMRect;
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("TabStrip", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(TabStripClass, TAB_STRIP_CSS);
  });

  test("shows each tab's label", () => {
    const { element } = setup();

    expect([...element.querySelectorAll("[role=tab]")].map(tab => tab.textContent)).toEqual(["Home", "apple"]);
  });

  test("updates a tab's label when it changes", () => {
    const tabStripItem = createTab("Home");
    const { element } = setup([tabStripItem]);

    (tabStripItem.label as Signal<string>).value = "All";
    expect(element.querySelector("[role=tab]")!.textContent).toBe("All");
  });

  test("marks only the active tab as selected", () => {
    const { element, activeTabId } = setup();

    activeTabId.value = "apple";
    expect([findTab(element, "Home"), findTab(element, "apple")].map(tab => tab.getAttribute("aria-selected"))).toEqual(["false", "true"]);
  });

  test("activates a clicked tab", () => {
    const { element, onActivate } = setup();

    findTab(element, "apple").click();
    expect(onActivate).toHaveBeenCalledWith("apple");
  });

  test("closes a tab from its close button", () => {
    const { element, onClose } = setup();

    findCloseButton(element, "apple")!.click();
    expect(onClose).toHaveBeenCalledWith("apple");
  });

  test("closes a tab on a middle click", () => {
    const { element, onClose } = setup();

    findTab(element, "apple").dispatchEvent(new MouseEvent("auxclick", { bubbles: true, button: 1 }));
    expect(onClose).toHaveBeenCalledWith("apple");
  });

  test("offers no way to close a tab that can't be closed", () => {
    const { element, onClose } = setup();

    findTab(element, "Home").dispatchEvent(new MouseEvent("auxclick", { bubbles: true, button: 1 }));
    expect([findCloseButton(element, "Home"), onClose.mock.calls]).toEqual([null, []]);
  });

  test("keeps a tab's element when other tabs open or close", () => {
    const { element, tabs } = setup();
    const home = findTab(element, "Home");

    tabs.value = [...tabs.value, createTab("banana")];
    tabs.value = tabs.value.filter(tabStripItem => tabStripItem.id !== "apple");
    expect([findTab(element, "Home"), element.querySelectorAll("[role=tab]").length]).toEqual([home, 2]);
  });

  test("animates in only the tabs opened after the first render, until the animation ends", () => {
    const { element, tabs } = setup();

    tabs.value = [...tabs.value, createTab("banana")];
    const isEntering = (): boolean[] => ["Home", "apple", "banana"].map(label => findTab(element, label).parentElement!.hasAttribute("data-entering"));
    const before = isEntering();

    findTab(element, "banana").parentElement!.dispatchEvent(new Event("animationend"));
    expect([before, isEntering()]).toEqual([[false, false, true], [false, false, false]]);
  });

  test("moves a dropped tab before or after the tab it lands on", () => {
    const { element, onMove } = setup([createTab("a"), createTab("b"), createTab("c")]);

    dropOn(element, "a", { draggedTabId: "c", clientX: 20 });
    dropOn(element, "b", { draggedTabId: "a", clientX: 80 });
    expect(onMove.mock.calls).toEqual([["c", 0], ["a", 1]]);
  });

  test("ignores a tab dropped on itself", () => {
    const { element, onMove } = setup();

    dropOn(element, "apple", { draggedTabId: "apple", clientX: 20 });
    expect(onMove).not.toHaveBeenCalled();
  });

  test("marks the side a dragged tab would land on, until it leaves", () => {
    const { element } = setup();
    const apple = findTab(element, "apple").parentElement!;

    dropOn(element, "apple", { draggedTabId: "Home", clientX: 80, type: "dragover" });
    const marked = apple.dataset.drop;

    apple.dispatchEvent(new Event("dragleave"));
    expect([marked, apple.dataset.drop]).toEqual(["after", undefined]);
  });

  test("carries a dragged tab's id and label", () => {
    const { element } = setup();
    const dataTransfer = new DataTransfer();
    const event = new MouseEvent("dragstart", { bubbles: true }) as DragEvent;

    Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
    findTab(element, "apple").parentElement!.dispatchEvent(event);
    expect([dataTransfer.getData("application/x-fsg-tab"), dataTransfer.getData("text/plain")]).toEqual(["apple", "apple"]);
  });

  test("ignores a drag or drop that carries no tab", () => {
    const { element, onMove } = setup();
    const apple = findTab(element, "apple").parentElement!;
    const dragover = new MouseEvent("dragover", { bubbles: true, cancelable: true });
    const drop = new MouseEvent("drop", { bubbles: true, cancelable: true });

    apple.dispatchEvent(dragover);
    apple.dispatchEvent(drop);
    expect([dragover.defaultPrevented, drop.defaultPrevented, apple.dataset.drop, onMove.mock.calls]).toEqual([false, false, undefined, []]);
  });

  test("scrolls the tabs sideways on a vertical wheel, leaving a horizontal wheel to the browser", () => {
    const { element } = setup();
    const list = findTabList(element);
    const vertical = new WheelEvent("wheel", { deltaY: 30, cancelable: true });
    const horizontal = new WheelEvent("wheel", { deltaX: 30, deltaY: 30, cancelable: true });
    const still = new WheelEvent("wheel", { cancelable: true });

    makeScrollable(list);
    list.dispatchEvent(vertical);
    list.dispatchEvent(horizontal);
    list.dispatchEvent(still);
    expect([list.scrollLeft, vertical.defaultPrevented, horizontal.defaultPrevented, still.defaultPrevented]).toEqual([30, true, false, false]);
  });

  test("scrolls the active tab into view", () => {
    const { element, activeTabId } = setup([createTab("a"), createTab("b"), createTab("c")], null);
    const list = findTabList(element);
    const scrollPositions: number[] = [];

    makeScrollable(list, 100);
    list.getBoundingClientRect = (): DOMRect => ({ left: 100, right: 300 }) as DOMRect;
    placeTab(element, "a", { left: 50, right: 150 });
    placeTab(element, "b", { left: 150, right: 250 });
    placeTab(element, "c", { left: 250, right: 350 });

    for (const tabId of ["a", "b", "c"]) {
      activeTabId.value = tabId;
      scrollPositions.push(list.scrollLeft);
    }
    expect(scrollPositions).toEqual([50, 50, 100]);
  });

  test("closes all tabs from the close all button", () => {
    const { element, onCloseAll } = setup();

    element.querySelector<HTMLButtonElement>("button[aria-label='Close All Tabs']")!.click();
    expect(onCloseAll).toHaveBeenCalledOnce();
  });

  test("adds a tab from the new tab button", () => {
    const { element, onAdd } = setup();

    element.querySelector<HTMLButtonElement>("button[aria-label='New Tab']")!.click();
    expect(onAdd).toHaveBeenCalledOnce();
  });
});
