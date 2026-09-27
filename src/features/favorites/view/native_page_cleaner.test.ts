import * as FavoritesNativePageCleaner from "@/features/favorites/view/native_page_cleaner";
import { afterEach, describe, expect, test, vi } from "vitest";

const globals = window as unknown as Record<string, unknown>;

function addScript(src: string): HTMLScriptElement {
  const script = document.createElement("script");

  script.type = "text/plain";
  script.setAttribute("src", src);
  document.head.append(script);
  return script;
}

function addContent(...ids: string[]): HTMLElement {
  const content = document.createElement("div");

  content.id = "content";
  content.innerHTML = ids.map(id => `<span class="thumb" id="s${id}"><a id="p${id}"><img src="https://example.com/${id}.jpg" title="apple banana"></a></span>`).join("");
  document.body.append(content);
  return content;
}

describe("FavoritesNativePageCleaner", () => {
  afterEach(() => {
    document.head.replaceChildren();
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  describe("removeOriginalUnusedScripts", () => {
    test("removes the site's player and autocomplete scripts, keeping the rest", () => {
      const player = addScript("https://example.com/fluidplayer.min.js");
      const autocomplete = addScript("https://example.com/awesomplete.js");
      const other = addScript("https://example.com/cherry.js");

      FavoritesNativePageCleaner.removeOriginalUnusedScripts();
      expect([player, autocomplete, other].map(script => script.isConnected)).toEqual([false, false, true]);
    });

    test("releases the globals those scripts left behind", () => {
      globals.fluidPlayer = {};
      globals.Awesomplete = {};

      FavoritesNativePageCleaner.removeOriginalUnusedScripts();
      expect(["fluidPlayer", "Awesomplete"].filter(name => name in globals)).toEqual([]);
    });

    test("logs a global it can't release and carries on", () => {
      const logged = vi.spyOn(console, "error").mockImplementation(() => { });

      Object.defineProperty(window, "dashjs", { value: {}, configurable: false });
      globals.captchaProvider = {};
      FavoritesNativePageCleaner.removeOriginalUnusedScripts();
      expect(logged).toHaveBeenCalledOnce();
      expect("captchaProvider" in globals).toBe(false);
    });
  });

  describe("takeNativeFavorites", () => {
    test("reads the page's favorites and removes them from the page", () => {
      const content = addContent("1", "2");
      const posts = FavoritesNativePageCleaner.takeNativeFavorites();

      expect(posts?.map(post => post.id)).toEqual(["1", "2"]);
      expect(content.isConnected).toBe(false);
      expect(content.attributes).toHaveLength(0);
    });

    test("gives nothing when the page has no favorites", () => {
      const content = addContent();

      expect(FavoritesNativePageCleaner.takeNativeFavorites()).toBeUndefined();
      expect(content.isConnected).toBe(false);
    });

    test("gives nothing when the page has no content", () => {
      expect(FavoritesNativePageCleaner.takeNativeFavorites()).toBeUndefined();
    });
  });
});
