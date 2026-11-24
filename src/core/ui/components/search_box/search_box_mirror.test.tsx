import { SearchBoxMirror, SearchBoxMirrorClass } from "@/core/ui/components/search_box/search_box_mirror";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import SEARCH_BOX_MIRROR_CSS from "@/core/ui/components/search_box/search_box_mirror.css?inline";
import { SearchBoxTextSpan } from "@/core/ui/components/search_box/search_box_text_span";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

const QUERY = "( a ~ ( b ) ) )";
const QUERY_SPANS: SearchBoxTextSpan[] = [
  { start: 0, end: 1, tone: 0, matchedStart: 12 },
  { start: 4, end: 5, tone: 0 },
  { start: 6, end: 7, tone: 1, matchedStart: 10 },
  { start: 10, end: 11, tone: 1, matchedStart: 6 },
  { start: 12, end: 13, tone: 0, matchedStart: 0 }
];

interface Setup {
  element: HTMLElement;
  text: Signal<string>;
  textSpans: Signal<readonly SearchBoxTextSpan[]>;
  caretIndex: Signal<number | null>;
}

function setup(caretIndex: number | null = null): Setup {
  const props = { text: new Signal(QUERY), textSpans: new Signal<readonly SearchBoxTextSpan[]>(QUERY_SPANS), caretIndex: new Signal(caretIndex) };
  const { result: element } = render(document, () => <SearchBoxMirror {...props} />);
  return { ...props, element };
}

function readSpans(element: HTMLElement): HTMLElement[] {
  return [...element.querySelectorAll<HTMLElement>("span")];
}

function readTones(element: HTMLElement): (string | undefined)[] {
  return readSpans(element).map(span => span.dataset.tone);
}

function readPairedIndexes(element: HTMLElement): number[] {
  return readSpans(element).flatMap((span, index) => (span.hasAttribute("data-paired") ? [index] : []));
}

describe("SearchBoxMirror", () => {
  test("shows the whole text", () => {
    expect(setup().element.textContent).toBe(QUERY);
  });

  test("gives each span its text and tone", () => {
    const { element } = setup();

    expect(readSpans(element).map(span => span.textContent)).toEqual(["(", "~", "(", ")", ")"]);
    expect(readTones(element)).toEqual(["0", "0", "1", "1", "0"]);
  });

  test("shows the text plain when there are no spans", () => {
    const { element, textSpans } = setup();

    textSpans.value = [];
    expect([element.textContent, readSpans(element)]).toEqual([QUERY, []]);
  });

  test("cycles tones past three", () => {
    const { element, textSpans } = setup();

    textSpans.value = [{ start: 0, end: 1, tone: 3 }, { start: 6, end: 7, tone: 5 }];
    expect(readTones(element)).toEqual(["0", "2"]);
  });

  test("follows the text and spans", () => {
    const { element, text, textSpans } = setup();

    text.value = "( b";
    textSpans.value = [{ start: 0, end: 1, tone: 0 }];
    expect([element.textContent, readTones(element)]).toEqual(["( b", ["0"]]);
  });

  test.each([
    [0, [0, 4]],
    [1, [0, 4]],
    [11, [2, 3]],
    [13, [0, 4]]
  ])("boxes the pair when the caret is at %i", (caretIndex, pairedIndexes) => {
    expect(readPairedIndexes(setup(caretIndex).element)).toEqual(pairedIndexes);
  });

  test.each([
    ["away from every span", 2],
    ["on a span without a partner", 5],
    ["absent", null]
  ])("boxes nothing when the caret is %s", (_, caretIndex) => {
    expect(readPairedIndexes(setup(caretIndex).element)).toEqual([]);
  });

  test("finds the partner by its start after other spans are dropped", () => {
    const { element, textSpans } = setup(0);

    textSpans.value = QUERY_SPANS.filter((_, index) => index !== 1);
    expect(readPairedIndexes(element)).toEqual([0, 3]);
  });

  test("boxes nothing when the partner is not among the spans", () => {
    const { element, textSpans } = setup(0);

    textSpans.value = [QUERY_SPANS[0]];
    expect(readPairedIndexes(element)).toEqual([]);
  });

  test("moves the box with the caret", () => {
    const { element, caretIndex } = setup(0);

    caretIndex.value = 7;
    expect(readPairedIndexes(element)).toEqual([2, 3]);
    caretIndex.value = null;
    expect(readPairedIndexes(element)).toEqual([]);
  });

  test("takes an extra class", () => {
    const { result: element } = render(document, () => (
      <SearchBoxMirror text={new Signal("")} textSpans={new Signal([])} caretIndex={new Signal(null)} className="fsg-Extra" />
    ));

    expect(element.classList.contains("fsg-Extra")).toBe(true);
  });

  test("hides itself from assistive technology", () => {
    expect(setup().element.getAttribute("aria-hidden")).toBe("true");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SearchBoxMirrorClass, SEARCH_BOX_MIRROR_CSS);
  });
});
