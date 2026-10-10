import { BrowserBitmapDecoder } from "@/adapters/browser/ports/bitmap_decoder/bitmap_decoder";
import { describe, expect, onTestFinished, test, vi } from "vitest";

describe("BrowserBitmapDecoder", () => {
  test("decodes the provided source with the browser API", async() => {
    const bitmap = { close: vi.fn() } as unknown as ImageBitmap;
    const createImageBitmap = vi.fn<(source: ImageBitmapSource) => Promise<ImageBitmap>>(() => Promise.resolve(bitmap));
    const source = new Blob(["image bytes"]);

    vi.stubGlobal("createImageBitmap", createImageBitmap);
    onTestFinished(() => {
      vi.unstubAllGlobals();
    });

    await expect(new BrowserBitmapDecoder().decode(source)).resolves.toBe(bitmap);
    expect(createImageBitmap).toHaveBeenCalledExactlyOnceWith(source);
  });
});
