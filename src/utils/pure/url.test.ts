import { describe, expect, test } from "vitest";
import { readQueryParam, withHostname, withNoQueryParams, withoutQueryParam } from "@/utils/pure/url";

describe("readQueryParam", () => {
  const url = "https://rule34.xxx/index.php?page=favorites&s=view&id=12345&pid=42";

  test("first param after ?", () => {
    expect(readQueryParam(url, "page")).toBe("favorites");
  });

  test("middle param", () => {
    expect(readQueryParam(url, "id")).toBe("12345");
  });

  test("last param", () => {
    expect(readQueryParam(url, "pid")).toBe("42");
  });

  test("missing param", () => {
    expect(readQueryParam(url, "missing")).toBeNull();
  });

  test("param name is a substring of another param", () => {
    expect(readQueryParam("https://x.com?id=1&pid=2", "id")).toBe("1");
  });

  test("empty value", () => {
    expect(readQueryParam("https://x.com?id=", "id")).toBe("");
  });

  test("no query string", () => {
    expect(readQueryParam("https://x.com", "id")).toBeNull();
  });

  test("decodes percent-encoded value", () => {
    expect(readQueryParam("https://x.com?q=a%20b", "q")).toBe("a b");
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

  test("missing param leaves url unchanged", () => {
    expect(withoutQueryParam("https://x.com/p?id=5", "missing")).toBe("https://x.com/p?id=5");
  });

  test("removes all occurrences of the param", () => {
    expect(withoutQueryParam("https://x.com/p?tag=a&tag=b&id=5", "tag")).toBe("https://x.com/p?id=5");
  });

  test("preserves hash", () => {
    expect(withoutQueryParam("https://x.com/p?id=5#top", "id")).toBe("https://x.com/p#top");
  });
});

describe("withoutNoQueryParams", () => {
  test("removes every param", () => {
    expect(withNoQueryParams("https://x.com/p?id=5&pid=2&tag=a")).toBe("https://x.com/p");
  });

  test("url without a query string is unchanged", () => {
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
