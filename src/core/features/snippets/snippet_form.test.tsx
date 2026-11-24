import { SnippetForm, SnippetFormClass, SnippetFormProps } from "@/core/features/snippets/snippet_form";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import SNIPPET_FORM_CSS from "@/core/features/snippets/snippet_form.css?inline";
import { TextFieldClass } from "@/core/ui/components/text_field/text_field";
import { createSnippet } from "@/testing/snippet";
import { expectClassesStyled } from "@/testing/css_utilities";

function setup(partialSnippetFormProps: Partial<SnippetFormProps> = {}): HTMLElement {
  return render(document, () => <SnippetForm isNameTaken={() => false} save={vi.fn()} cancel={vi.fn()} {...partialSnippetFormProps} />).result;
}

function readInput(snippetForm: HTMLElement, label: string): HTMLInputElement {
  return [...snippetForm.querySelectorAll("label")].find(textField => textField.firstChild?.textContent === label)!.querySelector("input")!;
}

function typeInto(snippetForm: HTMLElement, label: string, value: string): void {
  const input = readInput(snippetForm, label);

  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function findChip(snippetForm: HTMLElement, label: string): HTMLButtonElement | undefined {
  return [...snippetForm.querySelectorAll("button")].find(button => button.textContent === label);
}

function pressKey(snippetForm: HTMLElement, key: string): void {
  readInput(snippetForm, "Name").dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

function readShownSupportingText(snippetForm: HTMLElement): string | null {
  const supportingText = snippetForm.querySelector<HTMLElement>(`.${TextFieldClass.supportingText}`);
  return supportingText === null || supportingText.hidden ? null : supportingText.textContent;
}

describe("SnippetForm", () => {
  test("starts blank for a new snippet, without Delete", () => {
    const snippetForm = setup({ remove: vi.fn() });

    expect([readInput(snippetForm, "Name").value, readInput(snippetForm, "Query").value, findChip(snippetForm, "Delete")]).toEqual(["", "", undefined]);
  });

  test("starts from the snippet it edits", () => {
    const snippetForm = setup({ snippet: createSnippet({ name: "no ai", query: "-ai_generated" }) });

    expect([readInput(snippetForm, "Name").value, readInput(snippetForm, "Query").value]).toEqual(["no ai", "-ai_generated"]);
  });

  test("saves what was typed", () => {
    const save = vi.fn();
    const snippetForm = setup({ save });

    typeInto(snippetForm, "Name", "no ai");
    typeInto(snippetForm, "Query", "-ai_generated");
    findChip(snippetForm, "Save")!.click();
    expect(save).toHaveBeenCalledWith({ name: "no ai", query: "-ai_generated" });
  });

  test("disables Save while the name is blank", () => {
    const snippetForm = setup();

    typeInto(snippetForm, "Name", "   ");
    expect(findChip(snippetForm, "Save")!.disabled).toBe(true);
  });

  test("disables Save and says so while the name is taken", () => {
    const snippetForm = setup({ isNameTaken: name => name === "pets" });

    typeInto(snippetForm, "Name", "fruits");
    const freeState = [findChip(snippetForm, "Save")!.disabled, readShownSupportingText(snippetForm)];

    typeInto(snippetForm, "Name", "pets");
    expect([freeState, [findChip(snippetForm, "Save")!.disabled, readShownSupportingText(snippetForm)]])
      .toEqual([[false, null], [true, "A snippet with this name already exists"]]);
  });

  test("saves on Enter, unless Save is disabled", () => {
    const save = vi.fn();
    const snippetForm = setup({ save });

    pressKey(snippetForm, "Enter");
    typeInto(snippetForm, "Name", "no ai");
    pressKey(snippetForm, "Enter");
    expect(save.mock.calls).toEqual([[{ name: "no ai", query: "" }]]);
  });

  test("cancels on Escape and on Cancel", () => {
    const cancel = vi.fn();
    const snippetForm = setup({ cancel });

    pressKey(snippetForm, "Escape");
    findChip(snippetForm, "Cancel")!.click();
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  test("ignores other keys", () => {
    const save = vi.fn();
    const cancel = vi.fn();
    const snippetForm = setup({ snippet: createSnippet({ name: "no ai" }), save, cancel });

    pressKey(snippetForm, "a");
    expect([save.mock.calls, cancel.mock.calls]).toEqual([[], []]);
  });

  test("removes the snippet it edits", () => {
    const remove = vi.fn();
    const snippetForm = setup({ snippet: createSnippet({ name: "no ai" }), remove });

    findChip(snippetForm, "Delete")!.click();
    expect(remove).toHaveBeenCalledWith("no ai");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SnippetFormClass, SNIPPET_FORM_CSS);
  });
});
