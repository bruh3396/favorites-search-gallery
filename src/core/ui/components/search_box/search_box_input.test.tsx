import { SearchBoxInputClass, createSearchBoxInput } from "@/core/ui/components/search_box/search_box_input";
import { afterEach, describe, expect, test } from "vitest";
import SEARCH_BOX_INPUT_CSS from "@/core/ui/components/search_box/search_box_input.css?inline";
import { SearchBoxTextSpan } from "@/core/ui/components/search_box/search_box_text_span";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";
import { render } from "@/core/ui/h/h";

interface Setup {
  root: HTMLElement;
  textarea: HTMLTextAreaElement;
  text: Signal<string>;
}

function setup(getTextSpans?: (text: string) => readonly SearchBoxTextSpan[]): Setup {
  const text = new Signal("");
  const { result: { root, textarea } } = render(document, () => createSearchBoxInput({ label: "Search", text, getTextSpans }));

  document.body.append(root);
  return { root, textarea, text };
}

function spanEachParen(text: string): SearchBoxTextSpan[] {
  return [...text.matchAll(/[()]/g)].map(({ index }) => ({ start: index, end: index + 1, tone: 0 }));
}

function type(textarea: HTMLTextAreaElement, text: string): void {
  textarea.value = text;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function readMirror(root: HTMLElement): Element | null {
  return root.querySelector("[aria-hidden=true]");
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("createSearchBoxInput", () => {
  test("labels its field", () => {
    const { textarea } = setup();

    expect([textarea.getAttribute("aria-label"), textarea.placeholder]).toEqual(["Search", "Search"]);
  });

  test("shows the text written to it", () => {
    const { textarea, text } = setup();

    text.value = "cat";
    expect(textarea.value).toBe("cat");
  });

  test("writes typed text back", () => {
    const { textarea, text } = setup();

    type(textarea, "dog");
    expect(text.value).toBe("dog");
  });

  test("turns pasted line breaks into spaces, keeping the caret after them", () => {
    const { textarea, text } = setup();

    textarea.value = "cat\r\ndog\nfox";
    textarea.setSelectionRange(8, 8);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    expect([textarea.value, textarea.selectionStart, text.value]).toEqual(["cat dog fox", 7, "cat dog fox"]);
  });

  test("scrolls back to the start when left", () => {
    const { textarea } = setup();

    textarea.scrollTop = 20;
    textarea.scrollLeft = 30;
    textarea.dispatchEvent(new Event("blur"));
    expect([textarea.scrollTop, textarea.scrollLeft]).toEqual([0, 0]);
  });

  test("shows no mirror without text spans", () => {
    expect(readMirror(setup().root)).toBeNull();
  });

  test("mirrors the text with its spans, typed or written", () => {
    const { root, textarea, text } = setup(spanEachParen);
    const mirror = readMirror(root)!;

    type(textarea, "( a )");
    expect([mirror.textContent, mirror.querySelectorAll("span").length]).toEqual(["( a )", 2]);
    text.value = "( b";
    expect([mirror.textContent, mirror.querySelectorAll("span").length]).toEqual(["( b", 1]);
  });

  test("boxes the pair at the caret", () => {
    const { root, textarea } = setup(() => [{ start: 0, end: 1, tone: 0, matchedStart: 4 }, { start: 4, end: 5, tone: 0, matchedStart: 0 }]);

    type(textarea, "( a )");
    textarea.focus();
    textarea.setSelectionRange(0, 0);
    document.dispatchEvent(new Event("selectionchange"));
    expect(readMirror(root)!.querySelectorAll("[data-paired]")).toHaveLength(2);
  });

  test("scrolls the mirror with the field", () => {
    const { root, textarea } = setup(spanEachParen);
    const mirror = readMirror(root)!;

    textarea.scrollTop = 20;
    textarea.scrollLeft = 30;
    textarea.dispatchEvent(new Event("scroll"));
    expect([mirror.scrollTop, mirror.scrollLeft]).toEqual([20, 30]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SearchBoxInputClass, SEARCH_BOX_INPUT_CSS);
  });
});
