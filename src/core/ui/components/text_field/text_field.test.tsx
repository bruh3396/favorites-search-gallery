import { TextField, TextFieldClass } from "@/core/ui/components/text_field/text_field";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import TEXT_FIELD_CSS from "@/core/ui/components/text_field/text_field.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

function readInput(textField: HTMLElement): HTMLInputElement {
  return textField.querySelector("input")!;
}

function readShownSupportingText(textField: HTMLElement): string | null {
  const supportingText = textField.querySelector<HTMLElement>(`.${TextFieldClass.supportingText}`);
  return supportingText === null || supportingText.hidden ? null : supportingText.textContent;
}

describe("TextField", () => {
  test("names its input after its label", () => {
    const { result: textField } = render(document, () => <TextField label="Name" value={new Signal("")} onValueChange={vi.fn()} />);

    expect([textField.textContent, readInput(textField).labels?.[0]]).toEqual(["Name", textField]);
  });

  test("follows its value", () => {
    const value = new Signal("apple");
    const { result: textField } = render(document, () => <TextField label="Name" value={value} onValueChange={vi.fn()} />);
    const initialValue = readInput(textField).value;

    value.value = "banana";
    expect([initialValue, readInput(textField).value]).toEqual(["apple", "banana"]);
  });

  test("reports typed values", () => {
    const onValueChange = vi.fn();
    const { result: textField } = render(document, () => <TextField label="Name" value={new Signal("")} onValueChange={onValueChange} />);
    const input = readInput(textField);

    input.value = "apple";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(onValueChange).toHaveBeenCalledWith("apple");
  });

  test("shows its supporting text only while there is some", () => {
    const supportingText = new Signal("");
    const { result: textField } = render(document, () => (
      <TextField label="Name" value={new Signal("")} supportingText={supportingText} onValueChange={vi.fn()} />
    ));
    const initialSupportingText = readShownSupportingText(textField);

    supportingText.value = "Taken";
    expect([initialSupportingText, readShownSupportingText(textField)]).toEqual([null, "Taken"]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(TextFieldClass, TEXT_FIELD_CSS);
  });
});
