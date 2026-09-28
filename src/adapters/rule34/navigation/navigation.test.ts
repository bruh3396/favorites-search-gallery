import { afterEach, describe, expect, test, vi } from "vitest";
import { Rule34Navigation } from "@/adapters/rule34/navigation/navigation";

const site = {
  postPageUrl: (id: string): string => `post:${id}`,
  postListUrl: (query: string): string => `list:${query}`
};

function setup(): { navigation: Rule34Navigation; open: ReturnType<typeof vi.fn> } {
  const open = vi.fn();

  vi.stubGlobal("window", { open });
  return { navigation: new Rule34Navigation(site), open };
}

describe("Rule34Navigation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("links a post to its post page", () => {
    expect(new Rule34Navigation(site).postUrl("7")).toBe("post:7");
  });

  test("opens a post's page in a new tab", () => {
    const { navigation, open } = setup();

    navigation.openPost("7");
    expect(open).toHaveBeenCalledWith("post:7", "_blank");
  });

  test("opens a search as a post list", () => {
    const { navigation, open } = setup();

    navigation.openSearch("apple banana");
    expect(open).toHaveBeenCalledWith("list:apple banana");
  });
});
