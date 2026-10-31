import { describe, expect, test } from "vitest";
import { readRule34CdnLocator } from "@/adapters/rule34_cdn/client/rule34_cdn_locator";

describe("readRule34CdnLocator", () => {
  test("reads what minting kept", () => {
    expect(readRule34CdnLocator("1234/a1b2c3.png")).toEqual({ directory: "1234", stem: "a1b2c3", extension: "png" });
    expect(readRule34CdnLocator("1234/a1b2c3")).toEqual({ directory: "1234", stem: "a1b2c3", extension: null });
  });
});
