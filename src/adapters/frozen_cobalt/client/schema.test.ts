import { describe, expect, test } from "vitest";
import { parseBatch, parsePostResult, parseTagResult } from "@/adapters/frozen_cobalt/client/schema";

const frozenCobaltPost = {
  id: "1",
  width: 10,
  height: 10,
  score: 0,
  rating: "e",
  change: 0,
  fileURL: "",
  tagCategories: { apple: 0, alice: null }
};

describe("parseBatch", () => {
  test("parses a JSON object", () => {
    expect(parseBatch("{\"1\":{\"status\":\"deleted\",\"id\":\"1\"}}")).toEqual({ 1: { status: "deleted", id: "1" } });
  });

  test("rejects text that isn't JSON", () => {
    expect(() => parseBatch("<html>")).toThrow(expect.objectContaining({
      reason: "malformed",
      cause: expect.any(SyntaxError)
    }));
  });

  test("rejects JSON that isn't an object", () => {
    expect(() => parseBatch("[]")).toThrow(expect.objectContaining({ reason: "malformed" }));
  });
});

describe("parsePostResult", () => {
  test("accepts a served post", () => {
    const result = { status: "ok", post: frozenCobaltPost };

    expect(parsePostResult(result, "1")).toBe(result);
  });

  test("accepts each failure status with its id", () => {
    const results = ["rate_limited", "error", "deleted", "deferred"].map(status => ({ status, id: "1" }));

    expect(results.map(result => parsePostResult(result, "1"))).toEqual(results);
  });

  test("rejects a served post missing a field, naming the id", () => {
    const result = { status: "ok", post: { ...frozenCobaltPost, width: undefined } };

    expect(() => parsePostResult(result, "1")).toThrow(expect.objectContaining({ reason: "malformed", subject: "1" }));
  });

  test("rejects an unknown tag category code", () => {
    const result = { status: "ok", post: { ...frozenCobaltPost, tagCategories: { apple: 9 } } };

    expect(() => parsePostResult(result, "1")).toThrow(expect.objectContaining({ reason: "malformed" }));
  });

  test("rejects an unknown status", () => {
    expect(() => parsePostResult({
          status: "gone",
          id: "1"
        }, "1")).toThrow(expect.objectContaining({ reason: "malformed" }));
  });

  test("rejects a non-object", () => {
    expect(() => parsePostResult(null, "1")).toThrow(expect.objectContaining({ reason: "malformed" }));
  });
});

describe("parseTagResult", () => {
  test("accepts a known category code", () => {
    expect(parseTagResult({ status: "ok", category: 4 }, "alice")).toEqual({ status: "ok", category: 4 });
    expect(parseTagResult({ status: "ok", category: null }, "alice")).toEqual({ status: "ok", category: null });
  });

  test("accepts rate limited", () => {
    expect(parseTagResult({ status: "rate_limited" }, "alice")).toEqual({ status: "rate_limited" });
  });

  test("rejects an unknown category code, naming the tag", () => {
    const parse = (): unknown => parseTagResult({ status: "ok", category: 9 }, "alice");

    expect(parse).toThrow(expect.objectContaining({ reason: "malformed", subject: "alice" }));
  });

  test("rejects a non-object", () => {
    expect(() => parseTagResult("ok", "alice")).toThrow(expect.objectContaining({ reason: "malformed" }));
  });
});
