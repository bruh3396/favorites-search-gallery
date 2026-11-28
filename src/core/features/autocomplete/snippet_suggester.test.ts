import { describe, expect, test, vi } from "vitest";
import { Signal } from "@/core/utils/reactive/signal";
import { Snippet } from "@/core/domain/snippet/snippet";
import { SnippetSuggester } from "@/core/features/autocomplete/snippet_suggester";
import { createSnippet } from "@/testing/snippet";

interface Setup {
  snippetSuggester: SnippetSuggester;
  recordUse: (name: string) => Promise<void>;
}

function setup(snippets: readonly Snippet[], maxSuggestionCount: number = 10): Setup {
  const recordUse = vi.fn(() => Promise.resolve());
  const snippetSuggester = new SnippetSuggester({ maxSuggestionCount, minPrefixLength: 2 }, {
    snippetLibrary: { snippets: new Signal(snippets), recordUse }
  });
  return { snippetSuggester, recordUse };
}

function listTexts(snippets: readonly Snippet[], prefix: string): string[] {
  return setup(snippets).snippetSuggester.suggest(prefix).map(suggestion => suggestion.text);
}

describe("SnippetSuggester", () => {
  describe("suggest", () => {
    test("describes a snippet by its name, inserting its query", () => {
      const { snippetSuggester } = setup([createSnippet({ name: "no ai", query: "-ai_generated" })]);

      const expectedSuggestion = { text: "no ai", acceptedText: "-ai_generated ", icon: "bookmark", detail: "-ai_generated", onAccept: expect.any(Function) };

      expect(snippetSuggester.suggest("no")).toEqual([expectedSuggestion]);
    });

    test("matches the start of a name, ignoring its case", () => {
      const snippets = [createSnippet({ name: "No AI" }), createSnippet({ name: "piano" }), createSnippet({ name: "horses" })];

      expect(listTexts(snippets, "no")).toEqual(["No AI"]);
    });

    test("keeps a snippet whose whole name was typed", () => {
      expect(listTexts([createSnippet({ name: "horses" })], "horses")).toEqual(["horses"]);
    });

    test("never matches a query", () => {
      expect(listTexts([createSnippet({ name: "fruits", query: "apple" })], "ap")).toEqual([]);
    });

    test.each(["f", "fr:", "fruits:"])("suggests nothing for %s", prefix => {
      expect(listTexts([createSnippet({ name: "fruits" }), createSnippet({ name: "fr:x" })], prefix)).toEqual([]);
    });

    test("lists the most recently used first, up to the maximum", () => {
      const snippets = [
        createSnippet({ name: "cats", lastUsedAt: 1 }),
        createSnippet({ name: "cars", lastUsedAt: 3 }),
        createSnippet({ name: "cake", lastUsedAt: 2 })
      ];

      expect(setup(snippets, 2).snippetSuggester.suggest("ca").map(suggestion => suggestion.text)).toEqual(["cars", "cake"]);
    });

    test("records a use of an accepted snippet", () => {
      const { snippetSuggester, recordUse } = setup([createSnippet({ name: "no ai" })]);

      snippetSuggester.suggest("no")[0].onAccept?.();
      expect(recordUse).toHaveBeenCalledExactlyOnceWith("no ai");
    });
  });
});
