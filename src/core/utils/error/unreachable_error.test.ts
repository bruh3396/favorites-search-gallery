import { describe, expect, test } from "vitest";
import { UnreachableError } from "@/core/utils/error/unreachable_error";

describe("UnreachableError", () => {
  test("names the value the types said couldn't arrive", () => {
    expect(new UnreachableError("gone" as never).message).toContain("gone");
  });
});
