import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { CountBadgeClass } from "@/core/ui/components/count_badge/count_badge";
import { CountToggleButton } from "@/core/ui/components/count_toggle_button/count_toggle_button";
import { Signal } from "@/core/utils/reactive/signal";

interface Setup {
  element: HTMLButtonElement;
  pressed: Signal<boolean>;
  count: Signal<number>;
  readClickCount: () => number;
}

function setup(): Setup {
  const pressed = new Signal(false);
  const count = new Signal(0);
  let clickCount = 0;
  const countClick = (): void => {
    clickCount += 1;
  };
  const element = render(document, () => (
    <CountToggleButton icon="hash" label="Options" pressed={pressed} count={count} onClick={countClick} />
  )).result as HTMLButtonElement;
  return { element, pressed, count, readClickCount: () => clickCount };
}

describe("CountToggleButton", () => {
  test("follows whether it is pressed", () => {
    const { element, pressed } = setup();
    const before = element.getAttribute("aria-pressed");

    pressed.value = true;
    expect([before, element.getAttribute("aria-pressed")]).toEqual(["false", "true"]);
  });

  test("reports clicks without changing what it shows", () => {
    const { element, readClickCount } = setup();

    element.click();
    expect([readClickCount(), element.getAttribute("aria-pressed")]).toEqual([1, "false"]);
  });

  test("shows its label", () => {
    expect(setup().element.getAttribute("aria-label")).toBe("Options");
  });

  test("shows its count in a badge", () => {
    const { element, count } = setup();
    const badge = element.querySelector<HTMLElement>(`.${CountBadgeClass.root}`)!;

    count.value = 2;
    expect([badge.hidden, badge.textContent]).toEqual([false, "2"]);
  });

  test("sizes its badge with the button", () => {
    const { result: element } = render(document, () => (
      <CountToggleButton icon="hash" label="Options" size="large" pressed={new Signal(false)} count={new Signal(1)} onClick={() => undefined} />
    ));
    const badge = element.querySelector<HTMLElement>(`.${CountBadgeClass.root}`)!;

    expect([element.dataset.size, badge.dataset.size]).toEqual(["large", "large"]);
  });

  test("hides its badge while pressed", () => {
    const { element, pressed, count } = setup();
    const badge = element.querySelector<HTMLElement>(`.${CountBadgeClass.root}`)!;

    count.value = 2;
    pressed.value = true;
    expect(badge.hidden).toBe(true);
  });
});
