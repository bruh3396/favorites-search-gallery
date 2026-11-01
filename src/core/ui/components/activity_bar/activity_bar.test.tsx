import { ActivityBar, ActivityBarClass, ActivityBarItem } from "@/core/ui/components/activity_bar/activity_bar";
import { Mock, afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import ACTIVITY_BAR_CSS from "@/core/ui/components/activity_bar/activity_bar.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";
import { onCleanup } from "@/core/utils/reactive/scope";

const ITEMS: readonly ActivityBarItem[] = [
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "downloads", label: "Downloads", icon: "download" }
];

interface Setup {
  element: HTMLElement;
  renderView: Mock<(activityBarItem: ActivityBarItem) => HTMLElement>;
  disposeView: Mock<(id: string) => void>;
  onValueChange: Mock<(id: string | null) => void>;
  dispose: () => void;
}

function setup(initial: string | null = null): Setup {
  const value = new Signal<string | null>(initial);
  const disposeView = vi.fn<(id: string) => void>();
  const renderView = vi.fn((activityBarItem: ActivityBarItem): HTMLElement => {
    onCleanup(() => disposeView(activityBarItem.id));
    return <p>{activityBarItem.label}</p>;
  });
  const onValueChange = vi.fn((id: string | null): void => {
    value.value = id;
  });
  const { result: element, dispose } = render(document, () => (
    <ActivityBar items={ITEMS} value={value} renderView={renderView} onValueChange={onValueChange} />
  ));

  document.body.append(element);
  return { element, renderView, disposeView, onValueChange, dispose };
}

function findItem(element: HTMLElement, label: string): HTMLButtonElement {
  return element.querySelector<HTMLButtonElement>(`button[aria-label='${label}']`)!;
}

function findView(element: HTMLElement): HTMLElement {
  return element.querySelector<HTMLElement>("[role=region]")!;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("ActivityBar", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(ActivityBarClass, ACTIVITY_BAR_CSS);
  });

  test("hides the view while no item is active", () => {
    const { element, renderView } = setup();

    expect([findView(element).hidden, renderView.mock.calls.length]).toEqual([true, 0]);
  });

  test("shows the active item's view, named after it", () => {
    const { element } = setup("downloads");
    const view = findView(element);

    expect([view.hidden, view.textContent, view.getAttribute("aria-label")]).toEqual([false, "Downloads", "Downloads"]);
  });

  test("reports the item whose icon is clicked", () => {
    const { element, onValueChange } = setup("settings");

    findItem(element, "Downloads").click();
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("downloads");
  });

  test("reports no item when the active item's icon is clicked", () => {
    const { element, onValueChange } = setup("settings");

    findItem(element, "Settings").click();
    expect([onValueChange.mock.calls, findView(element).hidden]).toEqual([[[null]], true]);
  });

  test("keeps a closed view's content and reuses it when the same item reopens", () => {
    const { element, renderView, disposeView } = setup("settings");

    findItem(element, "Settings").click();
    const closedText = findView(element).textContent;

    findItem(element, "Settings").click();
    expect([closedText, renderView.mock.calls.length, disposeView.mock.calls.length]).toEqual(["Settings", 1, 0]);
  });

  test("presses only the active item", () => {
    const { element } = setup("downloads");
    const pressed = (label: string): string | null => findItem(element, label).getAttribute("aria-pressed");

    expect([pressed("Settings"), pressed("Downloads")]).toEqual(["false", "true"]);
  });

  test("disposes the view a switch replaces", () => {
    const { element, disposeView } = setup("settings");

    findItem(element, "Downloads").click();
    expect([findView(element).textContent, disposeView.mock.calls]).toEqual(["Downloads", [["settings"]]]);
  });

  test("disposes the shown view when it is disposed", () => {
    const { dispose, disposeView } = setup("settings");

    dispose();
    expect(disposeView).toHaveBeenCalledExactlyOnceWith("settings");
  });
});
