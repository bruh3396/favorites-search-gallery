import { BASE_INDEX_URL, RULE34_HOSTNAME, RULE34_ORIGIN } from "@/adapters/rule34/client/urls";
import { describe, expect, test } from "vitest";

describe("RULE34_ORIGIN", () => {
  test("serves the hostname over https", () => {
    const origin = new URL(RULE34_ORIGIN);

    expect(origin.protocol).toBe("https:");
    expect(origin.hostname).toBe(RULE34_HOSTNAME);
  });
});

describe("BASE_INDEX_URL", () => {
  test("names the page when a page is appended", () => {
    const url = new URL(`${BASE_INDEX_URL}favorites`);

    expect(url.origin).toBe(RULE34_ORIGIN);
    expect(url.pathname).toBe("/index.php");
    expect(url.searchParams.get("page")).toBe("favorites");
  });
});
