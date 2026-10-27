import { describe, expect, test } from "vitest";
import { parseFrozenCobaltTagResult } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_tag_result";

describe("parseFrozenCobaltTagResult", () => {
  test("accepts a known category code", () => {
    expect(parseFrozenCobaltTagResult({ status: "ok", category: 4 }, "alice")).toEqual({ status: "ok", category: 4 });
    expect(parseFrozenCobaltTagResult({ status: "ok", category: null }, "alice")).toEqual({ status: "ok", category: null });
  });

  test("accepts rate limited", () => {
    expect(parseFrozenCobaltTagResult({ status: "rate_limited" }, "alice")).toEqual({ status: "rate_limited" });
  });

  test("rejects an unknown category code, naming the tag", () => {
    const parse = (): unknown => parseFrozenCobaltTagResult({ status: "ok", category: 9 }, "alice");

    expect(parse).toThrow(expect.objectContaining({ reason: "malformed", subject: "alice" }));
  });

  test("rejects a non-object", () => {
    expect(() => parseFrozenCobaltTagResult("ok", "alice")).toThrow(expect.objectContaining({ reason: "malformed" }));
  });
});
