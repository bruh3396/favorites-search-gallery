import { afterEach, describe, expect, test } from "vitest";
import { render } from "@/core/ui/h/h";
import { trackCaret } from "@/core/ui/components/search_box/caret_tracker";

function setup(): { textarea: HTMLTextAreaElement; caretIndex: { value: number | null }; dispose: () => void } {
  const textarea = document.createElement("textarea");

  textarea.value = "cat dog";
  document.body.append(textarea);
  const { result: caretIndex, dispose } = render(document, () => trackCaret(textarea));
  return { textarea, caretIndex, dispose };
}

function selectionChange(): void {
  document.dispatchEvent(new Event("selectionchange"));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("trackCaret", () => {
  test("reports no caret before the field is focused", () => {
    expect(setup().caretIndex.value).toBeNull();
  });

  test("reads the caret when the field is focused", () => {
    const { textarea, caretIndex } = setup();

    textarea.setSelectionRange(3, 3);
    textarea.focus();
    expect(caretIndex.value).toBe(3);
  });

  test("follows the caret as the selection changes", () => {
    const { textarea, caretIndex } = setup();

    textarea.focus();
    textarea.setSelectionRange(5, 5);
    selectionChange();
    expect(caretIndex.value).toBe(5);
  });

  test("follows the caret as the text is typed", () => {
    const { textarea, caretIndex } = setup();

    textarea.focus();
    textarea.value = "cats dog";
    textarea.setSelectionRange(4, 4);
    textarea.dispatchEvent(new Event("input"));
    expect(caretIndex.value).toBe(4);
  });

  test("reads the caret inside a shadow root", () => {
    const host = document.createElement("div");
    const textarea = document.createElement("textarea");

    document.body.append(host);
    host.attachShadow({ mode: "open" }).append(textarea);
    const { result: caretIndex } = render(document, () => trackCaret(textarea));

    textarea.value = "cat";
    textarea.focus();
    textarea.setSelectionRange(2, 2);
    textarea.dispatchEvent(new Event("selectionchange"));
    expect(caretIndex.value).toBe(2);
  });

  test("reads no caret while text is selected", () => {
    const { textarea, caretIndex } = setup();

    textarea.focus();
    textarea.setSelectionRange(0, 3);
    selectionChange();
    expect(caretIndex.value).toBeNull();
  });

  test("clears the caret once the field is left", () => {
    const { textarea, caretIndex } = setup();

    textarea.focus();
    textarea.blur();
    expect(caretIndex.value).toBeNull();
  });

  test("stops following selection changes once disposed", () => {
    const { textarea, caretIndex, dispose } = setup();

    textarea.focus();
    textarea.setSelectionRange(1, 1);
    selectionChange();
    dispose();
    textarea.setSelectionRange(5, 5);
    selectionChange();
    expect(caretIndex.value).toBe(1);
  });
});
