import { describe, expect, test } from "vitest";
import { parseFrozenCobaltPostResult } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post_result";

const frozenCobaltPost = {
  id: "1",
  width: 10,
  height: 10,
  score: 0,
  rating: "explicit",
  changedAt: 0,
  directory: 1234,
  stem: "a1b2c3",
  extension: "jpg",
  tagCategoryByName: { apple: "general" }
};

describe("parseFrozenCobaltPostResult", () => {
  test("accepts a served post", () => {
    const result = { status: "ok", post: frozenCobaltPost };

    expect(parseFrozenCobaltPostResult(result, "1")).toBe(result);
  });

  test("accepts each failure status", () => {
    const results = ["deleted", "retry"].map(status => ({ status }));

    expect(results.map(result => parseFrozenCobaltPostResult(result, "1"))).toEqual(results);
  });

  test("rejects a served post missing a field, naming the id", () => {
    const result = { status: "ok", post: { ...frozenCobaltPost, width: undefined } };

    expect(() => parseFrozenCobaltPostResult(result, "1")).toThrow(expect.objectContaining({ reason: "malformed", subject: "1" }));
  });

  test("rejects an unknown status", () => {
    expect(() => parseFrozenCobaltPostResult({ status: "deferred" }, "1")).toThrow(expect.objectContaining({ reason: "malformed" }));
  });

  test("rejects a non-object", () => {
    expect(() => parseFrozenCobaltPostResult(null, "1")).toThrow(expect.objectContaining({ reason: "malformed" }));
  });
});
