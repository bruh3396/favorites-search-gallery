import { Mock, afterEach, describe, expect, test, vi } from "vitest";
import { TabStrip, TabStripClass, TabStripItem } from "@/core/ui/components/tabs/tab_strip";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import TAB_STRIP_CSS from "@/core/ui/components/tabs/tab_strip.css?inline";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  element: HTMLElement;
  tabs: Signal<readonly TabStripItem[]>;
  activeId: Signal<string | null>;
  onActivate: Mock<(id: string) => void>;
  onClose: Mock<(id: string) => void>;
  onAdd: Mock<() => void>;
}

function createTab(id: string, { closable = true }: { closable?: boolean } = {}): TabStripItem {
  return { id, label: new Signal(id), closable };
}

function setup(tabs: readonly TabStripItem[] = [createTab("Home", { closable: false }), createTab("apple")], activeId: string | null = "Home"): Setup {
  const options = {
    tabs: new Signal(tabs),
    activeId: new Signal(activeId),
    onActivate: vi.fn<(id: string) => void>(),
    onClose: vi.fn<(id: string) => void>(),
    onAdd: vi.fn<() => void>()
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
    const home = createTab("Home");
    const { element } = setup([home]);

    (home.label as Signal<string>).value = "All";
    expect(element.querySelector("[role=tab]")!.textContent).toBe("All");
  });

  test("marks only the active tab as selected", () => {
    const { element, activeId } = setup();

    activeId.value = "apple";
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
    tabs.value = tabs.value.filter(tab => tab.id !== "apple");
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

  test("adds a tab from the new tab button", () => {
    const { element, onAdd } = setup();

    element.querySelector<HTMLButtonElement>("button[aria-label='New tab']")!.click();
    expect(onAdd).toHaveBeenCalledOnce();
  });
});
