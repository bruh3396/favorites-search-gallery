import { ViewPane, ViewPaneAction, ViewPaneClass } from "@/core/ui/components/view_pane/view_pane";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import VIEW_PANE_CSS from "@/core/ui/components/view_pane/view_pane.css?inline";
import { expectClassesStyled } from "@/testing/css";

function setup(viewPaneActions: readonly ViewPaneAction[] = []): HTMLElement {
  return render(document, () => (
    <ViewPane title="Settings" actions={viewPaneActions}>
      <p>Body</p>
    </ViewPane>
  )).result;
}

function findAction(element: HTMLElement, label: string): HTMLButtonElement {
  return element.querySelector<HTMLButtonElement>(`button[aria-label='${label}']`)!;
}

describe("ViewPane", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(ViewPaneClass, VIEW_PANE_CSS);
  });

  test("shows its title as a heading and its children in the body", () => {
    const element = setup();

    expect([element.querySelector("h2")?.textContent, element.querySelector("p")?.textContent]).toEqual(["Settings", "Body"]);
  });

  test("calls an action when its button is clicked", () => {
    const onClick = vi.fn();
    const element = setup([{ label: "Reset all", icon: "reset", onClick }]);

    findAction(element, "Reset all").click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  test("follows an action's disabled signal", () => {
    const disabled = new Signal(true);
    const button = findAction(setup([{ label: "Reset all", icon: "reset", disabled, onClick: vi.fn() }]), "Reset all");
    const wasDisabled = button.disabled;

    disabled.value = false;
    expect([wasDisabled, button.disabled]).toEqual([true, false]);
  });

  test("follows an action's label signal", () => {
    const label = new Signal("Expand all");
    const element = setup([{ label, icon: "expandAll", onClick: vi.fn() }]);

    label.value = "Collapse all";
    expect(findAction(element, "Collapse all").title).toBe("Collapse all");
  });

  test("enables an action without a disabled signal", () => {
    expect(findAction(setup([{ label: "Reset all", icon: "reset", onClick: vi.fn() }]), "Reset all").disabled).toBe(false);
  });
});
