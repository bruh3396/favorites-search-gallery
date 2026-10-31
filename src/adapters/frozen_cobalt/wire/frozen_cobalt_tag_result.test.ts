import { describe, expect, test } from "vitest";
import { parseFrozenCobaltTagResult } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_tag_result";

describe("parseFrozenCobaltTagResult", () => {
  test("accepts a known category", () => {
    expect(parseFrozenCobaltTagResult({ status: "ok", category: "character" }, "alice")).toEqual({ status: "ok", category: "character" });
  });

  test("accepts each failure status", () => {
    expect(parseFrozenCobaltTagResult({ status: "not_found" }, "alice")).toEqual({ status: "not_found" });
    expect(parseFrozenCobaltTagResult({ status: "retry" }, "alice")).toEqual({ status: "retry" });
  });

  test("rejects an unknown category, naming the tag", () => {
    const parse = (): unknown => parseFrozenCobaltTagResult({ status: "ok", category: 4 }, "alice");

    expect(parse).toThrow(expect.objectContaining({ reason: "malformed", subject: "alice" }));
  });

  test("rejects an unknown status", () => {
    expect(() => parseFrozenCobaltTagResult({ status: "rate_limited" }, "alice")).toThrow(expect.objectContaining({ reason: "malformed" }));
  });

  test("rejects a non-object", () => {
    expect(() => parseFrozenCobaltTagResult("ok", "alice")).toThrow(expect.objectContaining({ reason: "malformed" }));
  });
});
