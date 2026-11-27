import { LabShell, LabShellClass, LabShellProps } from "@/targets/lab/shell/lab_shell";
import { Mock, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import LAB_SHELL_CSS from "@/targets/lab/shell/lab_shell.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";
import { onCleanup } from "@/core/utils/reactive/scope";

type LabTab = Parameters<LabShellProps["onActiveTabChange"]>[0];

interface Setup {
  element: HTMLElement;
  tabs: HTMLButtonElement[];
  activeTab: Signal<LabTab>;
  onActiveTabChange: Mock<(labTab: LabTab) => void>;
  disposePanel: Mock<(labTab: LabTab) => void>;
  dispose: () => void;
}

function setup(): Setup {
  const activeTab = new Signal<LabTab>("favorites");
  const onActiveTabChange = vi.fn<(labTab: LabTab) => void>();
  const disposePanel = vi.fn<(labTab: LabTab) => void>();
  const renderPanel = (labTab: LabTab): HTMLElement => {
    onCleanup(() => disposePanel(labTab));
    return <p>{labTab}</p>;
  };
  const { result: element, dispose } = render(document, () => (
    <LabShell activeTab={activeTab} renderPanel={renderPanel} onActiveTabChange={onActiveTabChange} />
  ));
  return { element, tabs: [...element.querySelectorAll<HTMLButtonElement>("[role=tab]")], activeTab, onActiveTabChange, disposePanel, dispose };
}

function readPanelText(element: HTMLElement): string | null | undefined {
  return element.querySelector("[role=tabpanel]")?.textContent;
}

describe("LabShell", () => {
  test("shows the brand, then the three tabs", () => {
    const { element, tabs } = setup();

    expect([element.querySelector("header")?.firstChild?.textContent, tabs.map(tab => tab.textContent)])
      .toEqual(["Lab", ["Favorites", "Storage", "Benchmarks"]]);
  });

  test("marks the active tab", () => {
    const { tabs, activeTab } = setup();

    activeTab.value = "benchmarks";
    expect(tabs.map(tab => tab.getAttribute("aria-selected"))).toEqual(["false", "false", "true"]);
  });

  test("asks to change tab when another is clicked", () => {
    const { tabs, onActiveTabChange } = setup();

    tabs[1].click();
    expect(onActiveTabChange).toHaveBeenCalledExactlyOnceWith("storage");
  });

  test("shows the active tab's panel and disposes the one it replaces", () => {
    const { element, activeTab, disposePanel } = setup();
    const before = readPanelText(element);

    activeTab.value = "storage";
    expect([before, readPanelText(element), disposePanel.mock.calls]).toEqual(["favorites", "storage", [["favorites"]]]);
  });

  test("disposes the shown panel when it is disposed", () => {
    const { dispose, disposePanel } = setup();

    dispose();
    expect(disposePanel).toHaveBeenCalledExactlyOnceWith("favorites");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(LabShellClass, LAB_SHELL_CSS);
  });
});
