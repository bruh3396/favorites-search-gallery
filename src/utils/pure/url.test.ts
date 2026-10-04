import { describe, expect, test } from "vitest";
import { hasQueryParams, isUrl, readQueryParam, withHostname, withNoQueryParams, withoutQueryParam } from "@/utils/pure/url";

describe("isUrl", () => {
  test("accepts an https url", () => {
    expect(isUrl("https://wimg.rule34.xxx/thumbnails//0123/thumbnail_123456abcde09.jpg")).toBe(true);
  });

  test("accepts an http url", () => {
    expect(isUrl("http://x.com/p")).toBe(true);
  });

  test("accepts a url on a different host", () => {
    expect(isUrl("https://api-cdn.rule34.xxx/thumbnails/1227/thumbnail_a34f3df084d16d51bbd0f5c06c68279f.jpg")).toBe(true);
  });

  test("rejects a compressed preview source", () => {
    expect(isUrl("0123_123456abcde09")).toBe(false);
  });

  test("rejects an empty string", () => {
    expect(isUrl("")).toBe(false);
  });

  test("rejects a non-http scheme", () => {
    expect(isUrl("ftp://x.com/p")).toBe(false);
  });
});

describe("readQueryParam", () => {
  const url = "https://rule34.xxx/index.php?page=favorites&s=view&id=12345&pid=42";

  test("reads the first param after ?", () => {
    expect(readQueryParam(url, "page")).toBe("favorites");
  });

  test("reads a middle param", () => {
    expect(readQueryParam(url, "id")).toBe("12345");
  });

  test("reads the last param", () => {
    expect(readQueryParam(url, "pid")).toBe("42");
  });

  test("returns null for a missing param", () => {
    expect(readQueryParam(url, "missing")).toBeNull();
  });

  test("ignores a param whose name contains the requested one", () => {
    expect(readQueryParam("https://x.com?id=1&pid=2", "id")).toBe("1");
  });

  test("reads an empty value", () => {
    expect(readQueryParam("https://x.com?id=", "id")).toBe("");
  });

  test("returns null without a query string", () => {
    expect(readQueryParam("https://x.com", "id")).toBeNull();
  });

  test("decodes percent-encoded value", () => {
    expect(readQueryParam("https://x.com?q=a%20b", "q")).toBe("a b");
  });
});

describe("hasQueryParams", () => {
  const url = "https://rule34.xxx/index.php?page=favorites&s=view&id=12345";

  test("returns true when every param matches", () => {
    expect(hasQueryParams(url, { page: "favorites", s: "view" })).toBe(true);
  });

  test("returns false when one param has a different value", () => {
    expect(hasQueryParams(url, { page: "favorites", s: "list" })).toBe(false);
  });

  test("returns false when one param is missing", () => {
    expect(hasQueryParams(url, { page: "favorites", tags: "all" })).toBe(false);
  });

  test("returns true for no params", () => {
    expect(hasQueryParams("https://x.com", {})).toBe(true);
  });

  test("compares decoded values", () => {
    expect(hasQueryParams("https://x.com?q=a%20b", { q: "a b" })).toBe(true);
  });
});

describe("withHostname", () => {
  test("replaces the hostname", () => {
    expect(withHostname("https://rule34.xxx/index.php", "api.rule34.xxx")).toBe("https://api.rule34.xxx/index.php");
  });

  test("preserves path, query, and hash", () => {
    expect(withHostname("https://rule34.xxx/index.php?id=5#top", "img.rule34.xxx")).toBe("https://img.rule34.xxx/index.php?id=5#top");
  });

  test("preserves port", () => {
    expect(withHostname("https://localhost:3000/path", "example.com")).toBe("https://example.com:3000/path");
  });

  test("preserves protocol", () => {
    expect(withHostname("http://a.com/x", "b.com")).toBe("http://b.com/x");
  });
});

describe("withoutQueryParam", () => {
  test("removes the named param", () => {
    expect(withoutQueryParam("https://x.com/p?id=5&pid=2", "pid")).toBe("https://x.com/p?id=5");
  });

  test("removes the only param, dropping the question mark", () => {
    expect(withoutQueryParam("https://x.com/p?id=5", "id")).toBe("https://x.com/p");
  });

  test("leaves the url unchanged for a missing param", () => {
    expect(withoutQueryParam("https://x.com/p?id=5", "missing")).toBe("https://x.com/p?id=5");
  });

  test("removes all occurrences of the param", () => {
    expect(withoutQueryParam("https://x.com/p?tag=a&tag=b&id=5", "tag")).toBe("https://x.com/p?id=5");
  });

  test("preserves hash", () => {
    expect(withoutQueryParam("https://x.com/p?id=5#top", "id")).toBe("https://x.com/p#top");
  });
});

describe("withNoQueryParams", () => {
  test("removes every param", () => {
    expect(withNoQueryParams("https://x.com/p?id=5&pid=2&tag=a")).toBe("https://x.com/p");
  });

  test("leaves a url without a query string unchanged", () => {
    expect(withNoQueryParams("https://x.com/p")).toBe("https://x.com/p");
  });

  test("preserves hash", () => {
    expect(withNoQueryParams("https://x.com/p?id=5#top")).toBe("https://x.com/p#top");
  });

  test("preserves protocol, port, and path", () => {
    expect(withNoQueryParams("http://localhost:3000/a/b?id=5")).toBe("http://localhost:3000/a/b");
  });

  test("drops a trailing question mark with no params", () => {
    expect(withNoQueryParams("https://x.com/p?")).toBe("https://x.com/p");
  });
});
