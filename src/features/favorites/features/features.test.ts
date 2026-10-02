import { afterEach, describe, expect, test, vi } from "vitest";
import { AppContext } from "@/app/context/context";
import { Favorite } from "@/types/favorite";
import { FavoritesFeatures } from "@/features/favorites/features/features";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { Snippet } from "@/features/favorites/features/snippets/types/types";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { attachAutocomplete } from "@/lib/ui/autocomplete/autocomplete";
import { createAppContext } from "@/testing/context";
import { createSnippet } from "@/features/favorites/features/snippets/testing/snippets";
import { flushMicrotasks } from "@/testing/async";

interface Setup {
  context: AppContext;
  features: FavoritesFeatures;
  results: Favorite[];
  appended: string[];
}

function createFavorite(id: string): Favorite {
  return { id, media: { kind: "image", locator: `1/${id}.png` } } as Partial<Favorite> as Favorite;
}

function setup(snippets: Snippet[] = []): Setup {
  const context = createAppContext();
  const results = [createFavorite("1"), createFavorite("2")];
  const appended: string[] = [];
  const store = new MemoryLocalKeyedValues();

  store.set("searchSnippets", snippets);
  const features = new FavoritesFeatures(context, {
    downloader: {
      batchSize: context.preferences.favorites.downloadBatchSize,
      filenameFormat: context.preferences.favorites.downloadFilenameFormat,
      getSearchResults: (): Favorite[] => results,
      getTagCategories: (): Promise<TagCategoryMap> => Promise.resolve(new Map()),
      getTagsForIds: (): Promise<Map<string, Set<string>>> => Promise.resolve(new Map()),
      fetchOriginal: (): Promise<Blob> => Promise.resolve(new Blob())
    },
    snippets: {
      appendToSearch: (text): number => appended.push(text),
      getSearchResults: (): Favorite[] => results,
      store
    }
  });

  features.setup();
  return { context, features, results, appended };
}

async function reachFavoritesLoaded(context: AppContext): Promise<void> {
  context.milestones.favorites.favoritesLoaded.reach();
  await flushMicrotasks();
}

function mountDownloader(features: FavoritesFeatures): HTMLButtonElement {
  const container = document.createElement("div");

  features.buildDownloaderSection().mount?.(container);
  return container.querySelector("[data-downloader-action]") as HTMLButtonElement;
}

function mountSnippets(features: FavoritesFeatures): HTMLElement {
  const container = document.createElement("div");

  features.buildSnippetsSection().mount?.(container);
  return container;
}

async function suggestionsFor(text: string): Promise<string[]> {
  const input = document.createElement("input");

  document.body.append(input);
  attachAutocomplete(input);
  input.focus();
  input.value = text;
  input.selectionStart = text.length;
  input.dispatchEvent(new Event("input"));
  await flushMicrotasks();
  return Array.from(document.querySelectorAll("li")).map(item => item.textContent ?? "");
}

describe("FavoritesFeatures", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  describe("downloader", () => {
    test("waits for favorites to load before offering a download", async () => {
      const { context, features } = setup();
      const download = mountDownloader(features);

      expect(download.disabled).toBe(true);
      await reachFavoritesLoaded(context);
      expect(download.disabled).toBe(false);
      expect(download.textContent).toBe("Download 2 Results");
    });

    test("follows the search results", async () => {
      const { context, features, results } = setup();
      const download = mountDownloader(features);

      await reachFavoritesLoaded(context);
      results.pop();
      context.events.favorites.searchResultsUpdated.emit(results);
      expect(download.textContent).toBe("Download 1 Result");
    });

    test.each([
      ["batch size", (context: AppContext): void => context.preferences.favorites.downloadBatchSize.set(1)],
      ["filename format", (context: AppContext): void => context.preferences.favorites.downloadFilenameFormat.set(1)]
    ])("redraws when the %s changes", async (_, change) => {
      const { context, features, results } = setup();
      const download = mountDownloader(features);

      await reachFavoritesLoaded(context);
      results.pop();
      change(context);
      expect(download.textContent).toBe("Download 1 Result");
    });
  });

  describe("snippets", () => {
    test("builds a section listing the stored snippets, with its actions", () => {
      const { features } = setup([createSnippet("fruits", "apple")]);
      const container = mountSnippets(features);

      expect(container.querySelector("[data-snippet-name]")?.getAttribute("data-snippet-name")).toBe("fruits");
      expect(features.buildSnippetsSection().actions?.length).toBeGreaterThan(0);
    });

    test("suggests stored snippets in search boxes", async() => {
      vi.stubGlobal("fetch", (): Promise<Response> => Promise.resolve(new Response("[]")));
      setup([createSnippet("fruits", "apple")]);
      expect(await suggestionsFor("/f")).toEqual(["/fruits (snippet)"]);
    });
  });
});
