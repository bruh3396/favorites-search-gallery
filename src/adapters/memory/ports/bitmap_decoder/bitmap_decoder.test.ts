import { describe, expect, test } from "vitest";
import { MemoryBitmapDecoder } from "@/adapters/memory/ports/bitmap_decoder/bitmap_decoder";

describe("MemoryBitmapDecoder", () => {
  test("returns a closable bitmap", async() => {
    const bitmap = await new MemoryBitmapDecoder().decode();

    expect([bitmap.width, bitmap.height, typeof bitmap.close]).toEqual([1, 1, "function"]);
    bitmap.close();
  });
});
