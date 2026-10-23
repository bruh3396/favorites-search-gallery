import { ORIGIN, WIMG_ORIGIN } from "@/adapters/rule34_cdn/client/hosts";
import { describe, expect, test } from "vitest";

describe("WIMG_ORIGIN", () => {
  test("serves a subdomain of the main origin over https", () => {
    const main = new URL(ORIGIN);
    const wimg = new URL(WIMG_ORIGIN);

    expect(wimg.protocol).toBe("https:");
    expect(wimg.hostname.endsWith(`.${main.hostname}`)).toBe(true);
  });
});
