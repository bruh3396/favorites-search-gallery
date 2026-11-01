import { EmptyState, EmptyStateAction, EmptyStateClass } from "@/core/ui/components/empty_state/empty_state";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import EMPTY_STATE_CSS from "@/core/ui/components/empty_state/empty_state.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

function findAction(element: HTMLElement): HTMLButtonElement {
  return element.querySelector<HTMLButtonElement>("button")!;
}

describe("EmptyState", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(EmptyStateClass, EMPTY_STATE_CSS);
  });

  test("shows its message", () => {
    const message = new Signal("Nothing here");
    const { result: element } = render(document, () => <EmptyState message={message} />);

    expect(element.textContent).toBe("Nothing here");
    message.value = "No results";
    expect(element.textContent).toBe("No results");
  });

  test("runs its action when clicked", () => {
    const onClick = vi.fn();
    const { result: element } = render(document, () => (
      <EmptyState message={new Signal("Nothing here")} action={new Signal({ label: "Clear", onClick })} />
    ));

    findAction(element).click();
    expect([findAction(element).textContent, onClick.mock.calls.length]).toEqual(["Clear", 1]);
  });

  test("hides the action while there is none", () => {
    const action = new Signal<EmptyStateAction | null>(null);
    const { result: element } = render(document, () => <EmptyState message={new Signal("Nothing here")} action={action} />);

    expect(findAction(element).hidden).toBe(true);
    action.value = { label: "Clear", onClick: vi.fn() };
    expect(findAction(element).hidden).toBe(false);
  });
});
