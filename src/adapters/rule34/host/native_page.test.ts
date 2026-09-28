import { afterEach, describe, expect, test, vi } from "vitest";
import { clearNativePage } from "@/adapters/rule34/host/native_page";

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

describe("clearNativePage", () => {
  afterEach(() => {
    document.head.replaceChildren();
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  test("removes the page's favorites and strips their attributes", () => {
    const content = addContent("1", "2");

    clearNativePage();
    expect(content.isConnected).toBe(false);
    expect(content.attributes).toHaveLength(0);
  });

  test("does nothing to content when the page has none", () => {
    expect(() => clearNativePage()).not.toThrow();
  });

  test("removes the site's player and autocomplete scripts, keeping the rest", () => {
    const player = addScript("https://example.com/fluidplayer.min.js");
    const autocomplete = addScript("https://example.com/awesomplete.js");
    const other = addScript("https://example.com/cherry.js");

    clearNativePage();
    expect([player, autocomplete, other].map(script => script.isConnected)).toEqual([false, false, true]);
  });

  test("releases the globals those scripts left behind", () => {
    globals.fluidPlayer = {};
    globals.Awesomplete = {};

    clearNativePage();
    expect(["fluidPlayer", "Awesomplete"].filter(name => name in globals)).toEqual([]);
  });

  test("logs a global it can't release and carries on", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => { });

    Object.defineProperty(window, "dashjs", { value: {}, configurable: false });
    globals.captchaProvider = {};
    clearNativePage();
    expect(logged).toHaveBeenCalledOnce();
    expect("captchaProvider" in globals).toBe(false);
  });
});
