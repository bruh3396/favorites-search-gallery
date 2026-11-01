import { Mock, describe, expect, test, vi } from "vitest";
import { TabPanel, TabPanelClass } from "@/core/ui/components/tabs/tab_panel";
import { h, render } from "@/core/ui/h/h";
import TAB_PANEL_CSS from "@/core/ui/components/tabs/tab_panel.css?inline";
import { Tab } from "@/core/ui/components/tabs/tab";
import { TabManager } from "@/core/ui/components/tabs/tab_manager";
import { expectClassesStyled } from "@/testing/css_utilities";
import { onCleanup } from "@/core/utils/reactive/scope";

interface Setup {
  element: HTMLElement;
  tabManager: TabManager<string>;
  renderPanel: Mock<(tab: Tab<string>) => HTMLElement>;
  disposePanel: Mock<(value: string) => void>;
  dispose: () => void;
}

function setup(values: readonly string[] = ["Home", "apple"]): Setup {
  const tabManager = new TabManager<string>({ dispose: vi.fn() });
  const disposePanel = vi.fn<(value: string) => void>();
  const renderPanel = vi.fn((tab: Tab<string>): HTMLElement => {
    onCleanup(() => disposePanel(tab.value));
    return <p>{tab.value}</p>;
  });

  values.forEach((value, index) => tabManager.open(value, value, { closable: index > 0 }));
  const { result: element, dispose } = render(document, () => <TabPanel tabManager={tabManager} renderPanel={renderPanel} />);
  return { element, tabManager, renderPanel, disposePanel, dispose };
}

describe("TabPanel", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(TabPanelClass, TAB_PANEL_CSS);
  });

  test("shows only the active tab's panel", () => {
    const { element, renderPanel } = setup();

    expect([element.getAttribute("role"), element.textContent, renderPanel.mock.calls.length]).toEqual(["tabpanel", "Home", 1]);
  });

  test("shows another tab's panel once it is active and disposes the one it replaces", () => {
    const { element, tabManager, disposePanel } = setup();

    tabManager.activate("apple");
    expect([element.textContent, disposePanel.mock.calls]).toEqual(["apple", [["Home"]]]);
  });

  test("keeps the panel when other tabs open or close", () => {
    const { element, tabManager, renderPanel } = setup(["Home", "apple", "banana"]);

    tabManager.open("cherry", "cherry");
    tabManager.close("banana");
    expect([element.textContent, renderPanel.mock.calls.length]).toEqual(["Home", 1]);
  });

  test("shows the neighbour's panel when the active tab closes", () => {
    const { element, tabManager } = setup();

    tabManager.activate("apple");
    tabManager.close("apple");
    expect(element.textContent).toBe("Home");
  });

  test("disposes the shown panel when it is disposed", () => {
    const { dispose, disposePanel } = setup();

    dispose();
    expect(disposePanel).toHaveBeenCalledExactlyOnceWith("Home");
  });
});
