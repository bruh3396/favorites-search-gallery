import { describe, expect, test } from "vitest";
import { parseFrozenCobaltPostResult } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post_result";

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

describe("parseFrozenCobaltPostResult", () => {
  test("accepts a served post", () => {
    const result = { status: "ok", post: frozenCobaltPost };

    expect(parseFrozenCobaltPostResult(result, "1")).toBe(result);
  });

  test("accepts each failure status with its id", () => {
    const results = ["rate_limited", "error", "deleted", "deferred"].map(status => ({ status, id: "1" }));

    expect(results.map(result => parseFrozenCobaltPostResult(result, "1"))).toEqual(results);
  });

  test("rejects a served post missing a field, naming the id", () => {
    const result = { status: "ok", post: { ...frozenCobaltPost, width: undefined } };

    expect(() => parseFrozenCobaltPostResult(result, "1")).toThrow(expect.objectContaining({ reason: "malformed", subject: "1" }));
  });

  test("rejects an unknown status", () => {
    expect(() => parseFrozenCobaltPostResult({
          status: "gone",
          id: "1"
        }, "1")).toThrow(expect.objectContaining({ reason: "malformed" }));
  });

  test("rejects a non-object", () => {
    expect(() => parseFrozenCobaltPostResult(null, "1")).toThrow(expect.objectContaining({ reason: "malformed" }));
  });
});
