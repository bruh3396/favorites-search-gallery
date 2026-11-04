import { describe, expect, test } from "vitest";
import { MemoryConfirmer } from "@/adapters/memory/ports/confirmer/memory_confirmer";

describe("MemoryConfirmer", () => {
  test("answers yes unless told otherwise", () => {
    expect(new MemoryConfirmer().confirm("Sure?")).toBe(true);
    expect(new MemoryConfirmer(false).confirm("Sure?")).toBe(false);
  });

  test("records each question it was asked, in order", () => {
    const confirmer = new MemoryConfirmer();

    confirmer.confirm("First?");
    confirmer.confirm("Second?");
    expect(confirmer.questions).toEqual(["First?", "Second?"]);
  });
});
