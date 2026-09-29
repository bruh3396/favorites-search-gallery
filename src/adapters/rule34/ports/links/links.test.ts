import { afterEach, describe, expect, test, vi } from "vitest";
import { Rule34Links } from "@/adapters/rule34/ports/links/links";

const rule34 = {
  postPageUrl: (id: string): string => `post:${id}`,
  postListUrl: (query: string): string => `list:${query}`
};

function setup(): { links: Rule34Links; open: ReturnType<typeof vi.fn> } {
  const open = vi.fn();

  vi.stubGlobal("window", { open });
  return { links: new Rule34Links(rule34), open };
}

describe("Rule34Links", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("links a post to its post page", () => {
    expect(new Rule34Links(rule34).postUrl("7")).toBe("post:7");
  });

  test("opens a URL in a new tab", () => {
    const { links, open } = setup();

    links.openInNewTab("https://file");
    expect(open).toHaveBeenCalledWith("https://file", "_blank");
  });

  test("opens a search as a post list", () => {
    const { links, open } = setup();

    links.openSearchInNewTab("apple banana");
    expect(open).toHaveBeenCalledWith("list:apple banana");
  });
});
