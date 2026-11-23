import { TextButton, TextButtonClass } from "@/core/ui/components/text_button/text_button";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import TEXT_BUTTON_CSS from "@/core/ui/components/text_button/text_button.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("TextButton", () => {
  test("shows its label and runs its action when clicked", () => {
    const onClick = vi.fn();
    const button = render(document, () => <TextButton label="Remove" onClick={onClick} />).result;

    button.click();
    expect([button.textContent, onClick.mock.calls.length]).toEqual(["Remove", 1]);
  });

  test("keeps focus where it is when pressed", () => {
    const button = render(document, () => <TextButton label="Remove" onClick={vi.fn()} />).result;
    const event = new PointerEvent("pointerdown", { bubbles: true, cancelable: true });

    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(TextButtonClass, TEXT_BUTTON_CSS);
  });
});
