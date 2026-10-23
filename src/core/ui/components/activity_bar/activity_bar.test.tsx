import { ActivityBar, ActivityBarClass, ActivityBarItem } from "@/core/ui/components/activity_bar/activity_bar";
import { Mock, afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import ACTIVITY_BAR_CSS from "@/core/ui/components/activity_bar/activity_bar.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";
import { onCleanup } from "@/core/utils/reactive/scope";

const ITEMS: readonly ActivityBarItem[] = [
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "downloads", label: "Downloads", icon: "download" }
];

interface Setup {
  element: HTMLElement;
  renderPanel: Mock<(item: ActivityBarItem) => HTMLElement>;
  disposePanel: Mock<(id: string) => void>;
  onValueChange: Mock<(id: string | null) => void>;
  dispose: () => void;
}

function setup(initial: string | null = null): Setup {
  const value = new Signal<string | null>(initial);
  const disposePanel = vi.fn<(id: string) => void>();
  const renderPanel = vi.fn((item: ActivityBarItem): HTMLElement => {
    onCleanup(() => disposePanel(item.id));
    return <p>{item.label}</p>;
  });
  const onValueChange = vi.fn((id: string | null): void => {
    value.value = id;
  });
  const { result: element, dispose } = render(document, () => (
    <ActivityBar items={ITEMS} value={value} renderPanel={renderPanel} onValueChange={onValueChange} />
  ));

  document.body.append(element);
  return { element, renderPanel, disposePanel, onValueChange, dispose };
}

function findItem(element: HTMLElement, label: string): HTMLButtonElement {
  return element.querySelector<HTMLButtonElement>(`button[aria-label='${label}']`)!;
}

function findPanel(element: HTMLElement): HTMLElement {
  return element.querySelector<HTMLElement>("[role=region]")!;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("ActivityBar", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(ActivityBarClass, ACTIVITY_BAR_CSS);
  });

  test("hides the panel while no item is active", () => {
    const { element, renderPanel } = setup();

    expect([findPanel(element).hidden, renderPanel.mock.calls.length]).toEqual([true, 0]);
  });

  test("shows the active item's panel, named after it", () => {
    const { element } = setup("downloads");
    const panel = findPanel(element);

    expect([panel.hidden, panel.textContent, panel.getAttribute("aria-label")]).toEqual([false, "Downloads", "Downloads"]);
  });

  test("reports the item whose icon is clicked", () => {
    const { element, onValueChange } = setup("settings");

    findItem(element, "Downloads").click();
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("downloads");
  });

  test("reports no item when the active item's icon is clicked", () => {
    const { element, onValueChange } = setup("settings");

    findItem(element, "Settings").click();
    expect([onValueChange.mock.calls, findPanel(element).hidden]).toEqual([[[null]], true]);
  });

  test("presses only the active item", () => {
    const { element } = setup("downloads");
    const pressed = (label: string): string | null => findItem(element, label).getAttribute("aria-pressed");

    expect([pressed("Settings"), pressed("Downloads")]).toEqual(["false", "true"]);
  });

  test("disposes the panel a switch replaces", () => {
    const { element, disposePanel } = setup("settings");

    findItem(element, "Downloads").click();
    expect([findPanel(element).textContent, disposePanel.mock.calls]).toEqual(["Downloads", [["settings"]]]);
  });

  test("disposes the shown panel when it is disposed", () => {
    const { dispose, disposePanel } = setup("settings");

    dispose();
    expect(disposePanel).toHaveBeenCalledExactlyOnceWith("settings");
  });
});
