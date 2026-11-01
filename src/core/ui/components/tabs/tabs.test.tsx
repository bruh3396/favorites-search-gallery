import { Mock, afterEach, describe, expect, test, vi } from "vitest";
import { Tabs, TabsClass } from "@/core/ui/components/tabs/tabs";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import TABS_CSS from "@/core/ui/components/tabs/tabs.css?inline";
import { Tab } from "@/core/ui/components/tabs/tab";
import { TabManager } from "@/core/ui/components/tabs/tab_manager";
import { expectClassesStyled } from "@/testing/css_utilities";
import { onCleanup } from "@/core/utils/reactive/scope";

interface Setup {
  element: HTMLElement;
  tabManager: TabManager<string>;
  renderPanel: Mock<(tab: Tab<string>) => HTMLElement>;
  disposePanel: Mock<(value: string) => void>;
  onAdd: Mock<() => void>;
  onClose: Mock<(tabId: string) => void>;
  stripVisible: Signal<boolean>;
  dispose: () => void;
}

function setup(values: readonly string[] = ["Home", "apple"]): Setup {
  const tabManager = new TabManager<string>({ dispose: vi.fn() });
  const disposePanel = vi.fn<(value: string) => void>();
  const renderPanel = vi.fn((tab: Tab<string>): HTMLElement => {
    onCleanup(() => disposePanel(tab.value));
    return <p>{tab.value}</p>;
  });
  const onAdd = vi.fn<() => void>();
  const onClose = vi.fn((tabId: string): void => tabManager.close(tabId));
  const stripVisible = new Signal(true);

  values.forEach((value, index) => tabManager.open(value, value, { closable: index > 0 }));
  const { result: element, dispose } = render(document, () => (
    <Tabs
      tabManager={tabManager}
      label={tab => new Signal(tab.value)}
      renderPanel={renderPanel}
      stripVisible={stripVisible}
      onAdd={onAdd}
      onClose={onClose}
      onCloseAll={vi.fn()}
    />
  ));

  document.body.append(element);
  return { element, tabManager, renderPanel, disposePanel, onAdd, onClose, stripVisible, dispose };
}

function isStripHidden(element: HTMLElement): boolean {
  return element.querySelector("[role=tablist]")!.closest("[hidden]") !== null;
}

function readPanel(element: HTMLElement): string {
  return element.querySelector("[role=tabpanel]")!.textContent!;
}

function findTab(element: HTMLElement, label: string): HTMLButtonElement {
  return [...element.querySelectorAll<HTMLButtonElement>("[role=tab]")].find(tab => tab.textContent === label)!;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("Tabs", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(TabsClass, TABS_CSS);
  });

  test("shows only the active tab's panel", () => {
    const { element, renderPanel } = setup();

    expect([readPanel(element), renderPanel.mock.calls.length]).toEqual(["Home", 1]);
  });

  test("shows a tab's panel once it is clicked and disposes the one it replaces", () => {
    const { element, disposePanel } = setup();

    findTab(element, "apple").click();
    expect([readPanel(element), disposePanel.mock.calls]).toEqual(["apple", [["Home"]]]);
  });

  test("keeps the panel when other tabs open or close", () => {
    const { element, tabManager, renderPanel } = setup(["Home", "apple", "banana"]);

    tabManager.open("cherry", "cherry");
    tabManager.close("banana");
    expect([readPanel(element), renderPanel.mock.calls.length]).toEqual(["Home", 1]);
  });

  test("shows the neighbour's panel when the active tab closes", () => {
    const { element, tabManager } = setup();

    tabManager.activate("apple");
    element.querySelector<HTMLButtonElement>("button[aria-label='Close apple']")!.click();
    expect([readPanel(element), tabManager.tabs.value.length]).toEqual(["Home", 1]);
  });

  test("reports the tab whose close button is clicked", () => {
    const { element, onClose } = setup();

    element.querySelector<HTMLButtonElement>("button[aria-label='Close apple']")!.click();
    expect(onClose).toHaveBeenCalledExactlyOnceWith("apple");
  });

  test("adds a tab from the new tab button", () => {
    const { element, onAdd } = setup();

    element.querySelector<HTMLButtonElement>("button[aria-label='New tab']")!.click();
    expect(onAdd).toHaveBeenCalledOnce();
  });

  test("moves a tab dropped on another", () => {
    const { element, tabManager } = setup(["Home", "apple", "banana"]);
    const target = findTab(element, "Home").parentElement!;
    const dataTransfer = new DataTransfer();
    const event = new MouseEvent("drop", { bubbles: true, cancelable: true, clientX: 0 });

    dataTransfer.setData("application/x-fsg-tab", tabManager.tabs.value[2].id);
    Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
    target.getBoundingClientRect = (): DOMRect => ({ left: 0, width: 100 }) as DOMRect;
    target.dispatchEvent(event);
    expect(tabManager.tabs.value.map(tab => tab.value)).toEqual(["banana", "Home", "apple"]);
  });

  test("hides and shows the strip while keeping the shown panel", () => {
    const { element, renderPanel, disposePanel, stripVisible } = setup();

    stripVisible.value = false;
    const wasHidden = isStripHidden(element);

    stripVisible.value = true;
    expect([wasHidden, isStripHidden(element), readPanel(element), renderPanel.mock.calls.length, disposePanel.mock.calls])
      .toEqual([true, false, "Home", 1, []]);
  });

  test("disposes the shown panel when it is disposed", () => {
    const { dispose, disposePanel } = setup();

    dispose();
    expect(disposePanel).toHaveBeenCalledExactlyOnceWith("Home");
  });
});
