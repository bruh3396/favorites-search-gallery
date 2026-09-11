import { describe, expect, test } from "vitest";
import { loadPreviewSource, storePreviewSource } from "@/features/favorites/types/preview_source_compression";

describe("storePreviewSource + loadPreviewSource", () => {
  test("normal", () => {
    const source = "5486_449336ccb6c2197dc843ab66bdcb8534";
    const index = storePreviewSource(source);

    expect(loadPreviewSource(index)).toBe(source);
  });

  test("normal 2", () => {
    const source = "1545_df6db35932fbd7df268a318725ab03674633bbb4";
    const index = storePreviewSource(source);

    expect(loadPreviewSource(index)).toBe(source);
  });

  test("normal 3", () => {
    const source = "3737_3c03533c217bf2734b737f6a970560e58809d898";
    const index = storePreviewSource(source);

    expect(loadPreviewSource(index)).toBe(source);
  });

  test("another 160-bit source", () => {
    const source = "95_55d97e50edaddb658842845b8e0ac3390de92092";
    const index = storePreviewSource(source);

    expect(loadPreviewSource(index)).toBe(source);
  });
});
