import { ALL_POST_STATUSES_MASK, isPostStatusMask, toPostStatusMask } from "@/core/domain/post/post_status_mask";
import { describe, expect, test } from "vitest";
import { POST_STATUSES } from "@/core/domain/post/post_status";

describe("toPostStatusMask", () => {
  test("gives each status its own bit, together making up every status", () => {
    const masks = POST_STATUSES.map(toPostStatusMask);

    expect(masks.every(mask => mask > 0 && (mask & (mask - 1)) === 0)).toBe(true);
    expect(new Set(masks).size).toBe(POST_STATUSES.length);
    expect(masks.reduce((all, mask) => all | mask, 0)).toBe(ALL_POST_STATUSES_MASK);
  });
});

describe("isPostStatusMask", () => {
  test("accepts every combination of statuses, including none", () => {
    for (let mask = 0; mask <= ALL_POST_STATUSES_MASK; mask += 1) {
      expect(isPostStatusMask(mask)).toBe(true);
    }
  });

  test.each([-1, ALL_POST_STATUSES_MASK + 1, 1.5, "7", undefined])("rejects %s", value => {
    expect(isPostStatusMask(value)).toBe(false);
  });
});
