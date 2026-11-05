import { describe, expect, test, vi } from "vitest";
import { Autocomplete } from "@/core/features/autocomplete/autocomplete";
import { Suggestion } from "@/core/ui/components/suggestion_list/suggestion";
import { TextEdit } from "@/core/ui/components/search_box/text_edit";

const WORDS = ["cat", "cat_ears", "cats", "score:", "(cat"];

interface Setup {
  autocomplete: Autocomplete;
  suggest: (prefix: string) => readonly Suggestion[];
  textEdits: TextEdit[];
}

function setup(): Setup {
  const suggest = vi.fn((prefix: string) => WORDS.filter(word => word.startsWith(prefix)).map(text => ({ text })));
  const autocomplete = new Autocomplete({ suggesters: [{ suggest }] });
  const textEdits: TextEdit[] = [];

  autocomplete.textEdits.on(textEdit => textEdits.push(textEdit));
  return { autocomplete, suggest, textEdits };
}

function type(autocomplete: Autocomplete, query: string): void {
  autocomplete.update(query, query.length);
}

function press(autocomplete: Autocomplete, key: string, modifiers: KeyboardEventInit = {}): boolean {
  return autocomplete.handleKey(new KeyboardEvent("keydown", { key, ...modifiers }));
}

function listTexts(autocomplete: Autocomplete): string[] {
  return autocomplete.suggestions.value.map(suggestion => suggestion.text);
}

describe("Autocomplete", () => {
  describe("update", () => {
    test("suggests for the word at the caret", () => {
      const { autocomplete } = setup();

      autocomplete.update("dog ca fox", 6);
      expect(listTexts(autocomplete)).toEqual(["cat", "cat_ears", "cats"]);
    });

    test("lists each suggester's suggestions in suggester order", () => {
      const autocomplete = new Autocomplete({
        suggesters: [{ suggest: (): Suggestion[] => [{ text: "cat" }] }, { suggest: (): Suggestion[] => [{ text: "cab" }] }]
      });

      type(autocomplete, "ca");
      expect(listTexts(autocomplete)).toEqual(["cat", "cab"]);
    });

    test("suggests after a negation", () => {
      const { autocomplete } = setup();

      type(autocomplete, "-sc");
      expect(listTexts(autocomplete)).toEqual(["score:"]);
    });

    test("suggests after a leading wildcard", () => {
      const { autocomplete } = setup();

      type(autocomplete, "*sc");
      expect(listTexts(autocomplete)).toEqual(["score:"]);
    });

    test("tells each row how much of it was typed", () => {
      const { autocomplete } = setup();

      type(autocomplete, "ca");
      expect(autocomplete.suggestions.value.map(suggestion => suggestion.matchedLength)).toEqual([2, 2, 2]);
    });

    test("ignores the case of the typed word", () => {
      const { autocomplete } = setup();

      type(autocomplete, "SC");
      expect(listTexts(autocomplete)).toEqual(["score:"]);
    });

    test("keeps a suggestion equal to the typed word", () => {
      const { autocomplete } = setup();

      type(autocomplete, "cat");
      expect(listTexts(autocomplete)).toEqual(["cat", "cat_ears", "cats"]);
    });

    test.each(["ca*", "*cat*", "**cat", "*", "(", ")", "~", "-(", "-"])("suggests nothing for %s", word => {
      const { autocomplete, suggest } = setup();

      type(autocomplete, word);
      expect([listTexts(autocomplete), vi.mocked(suggest).mock.calls]).toEqual([[], []]);
    });

    test("suggests nothing when a wildcard follows the caret", () => {
      const { autocomplete } = setup();

      autocomplete.update("ca*", 2);
      expect(listTexts(autocomplete)).toEqual([]);
    });

    test("clears the list once the word is gone", () => {
      const { autocomplete } = setup();

      type(autocomplete, "ca");
      type(autocomplete, "ca ");
      expect(listTexts(autocomplete)).toEqual([]);
    });

    test("clears the highlight while typing", () => {
      const { autocomplete } = setup();

      type(autocomplete, "c");
      press(autocomplete, "ArrowDown");
      type(autocomplete, "ca");
      expect(autocomplete.highlightedIndex.value).toBeNull();
    });
  });

  describe("close", () => {
    test("clears the list and the highlight", () => {
      const { autocomplete } = setup();

      type(autocomplete, "ca");
      press(autocomplete, "ArrowDown");
      autocomplete.close();
      expect([listTexts(autocomplete), autocomplete.highlightedIndex.value]).toEqual([[], null]);
    });

    test("leaves nothing to accept", () => {
      const { autocomplete, textEdits } = setup();

      type(autocomplete, "ca");
      autocomplete.close();
      autocomplete.accept({ text: "cat" });
      expect(textEdits).toEqual([]);
    });
  });

  describe("handleKey", () => {
    test("moves the highlight with the arrows, wrapping both ways", () => {
      const { autocomplete } = setup();
      const highlightedIndices: (number | null)[] = [];

      type(autocomplete, "ca");

      for (const key of ["ArrowDown", "ArrowDown", "ArrowDown", "ArrowDown", "ArrowUp"]) {
        expect(press(autocomplete, key)).toBe(true);
        highlightedIndices.push(autocomplete.highlightedIndex.value);
      }
      expect(highlightedIndices).toEqual([0, 1, 2, 0, 2]);
    });

    test("starts from the last row on ArrowUp", () => {
      const { autocomplete } = setup();

      type(autocomplete, "ca");
      press(autocomplete, "ArrowUp");
      expect(autocomplete.highlightedIndex.value).toBe(2);
    });

    test("accepts the first row on Tab with nothing highlighted", () => {
      const { autocomplete, textEdits } = setup();

      type(autocomplete, "dog ca");
      expect([press(autocomplete, "Tab"), textEdits]).toEqual([true, [{ start: 4, end: 6, text: "cat" }]]);
    });

    test("accepts the highlighted row on Tab", () => {
      const { autocomplete, textEdits } = setup();

      type(autocomplete, "ca");
      press(autocomplete, "ArrowDown");
      press(autocomplete, "ArrowDown");
      press(autocomplete, "Tab");
      expect(textEdits).toEqual([{ start: 0, end: 2, text: "cat_ears" }]);
    });

    test("leaves Enter to the search box with nothing highlighted", () => {
      const { autocomplete, textEdits } = setup();

      type(autocomplete, "ca");
      expect([press(autocomplete, "Enter"), textEdits]).toEqual([false, []]);
    });

    test("accepts the highlighted row on Enter", () => {
      const { autocomplete, textEdits } = setup();

      type(autocomplete, "ca");
      press(autocomplete, "ArrowUp");
      expect([press(autocomplete, "Enter"), textEdits]).toEqual([true, [{ start: 0, end: 2, text: "cats" }]]);
    });

    test("closes on Escape, taking the key", () => {
      const { autocomplete } = setup();

      type(autocomplete, "ca");
      expect([press(autocomplete, "Escape"), listTexts(autocomplete)]).toEqual([true, []]);
    });

    test.each(["ArrowLeft", "ArrowRight", "Home", "End"])("closes on %s, leaving the caret to move", key => {
      const { autocomplete } = setup();

      type(autocomplete, "ca");
      expect([press(autocomplete, key), listTexts(autocomplete)]).toEqual([false, []]);
    });

    test("leaves other keys alone", () => {
      const { autocomplete } = setup();

      type(autocomplete, "ca");
      expect([press(autocomplete, "a"), listTexts(autocomplete)]).toEqual([false, ["cat", "cat_ears", "cats"]]);
    });

    test.each(["ArrowDown", "ArrowUp", "Tab", "Enter", "Escape"])("leaves %s alone with an empty list", key => {
      expect(press(setup().autocomplete, key)).toBe(false);
    });

    test.each([{ shiftKey: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }, { isComposing: true }])("leaves Tab alone with %o", modifiers => {
      const { autocomplete, textEdits } = setup();

      type(autocomplete, "ca");
      expect([press(autocomplete, "Tab", modifiers), textEdits]).toEqual([false, []]);
    });
  });

  describe("accept", () => {
    test("replaces the whole word around the caret", () => {
      const { autocomplete, textEdits } = setup();

      autocomplete.update("dog cax fox", 6);
      autocomplete.accept({ text: "cat" });
      expect(textEdits).toEqual([{ start: 4, end: 7, text: "cat" }]);
    });

    test("keeps a negation", () => {
      const { autocomplete, textEdits } = setup();

      type(autocomplete, "-ca");
      autocomplete.accept({ text: "cat" });
      expect(textEdits).toEqual([{ start: 1, end: 3, text: "cat" }]);
    });

    test("keeps a leading wildcard", () => {
      const { autocomplete, textEdits } = setup();

      type(autocomplete, "*ca");
      autocomplete.accept({ text: "cat" });
      expect(textEdits).toEqual([{ start: 1, end: 3, text: "cat" }]);
    });

    test("inserts a suggestion's accepted text", () => {
      const { autocomplete, textEdits } = setup();

      type(autocomplete, "ca");
      autocomplete.accept({ text: "cat", acceptedText: "cat " });
      expect(textEdits).toEqual([{ start: 0, end: 2, text: "cat " }]);
    });

    test("does nothing without a word at the caret", () => {
      const { autocomplete, textEdits } = setup();

      type(autocomplete, "dog ");
      autocomplete.accept({ text: "cat" });
      expect(textEdits).toEqual([]);
    });

    test("does nothing before the first update", () => {
      const { autocomplete, textEdits } = setup();

      autocomplete.accept({ text: "cat" });
      expect(textEdits).toEqual([]);
    });
  });
});
