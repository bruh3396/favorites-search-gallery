import { decodeBitmap, loadImage } from "@/adapters/browser/image/image";
import { describe, expect, onTestFinished, test, vi } from "vitest";

// Settles each image as told the moment its source is set, since happy-dom loads no images.
function stubImageLoads(outcome: "load" | "error" | "pending"): { urls: string[] } {
  const urls: string[] = [];
  const setSource = vi.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(function settleImage(this: HTMLImageElement, url: string) {
    urls.push(url);

    if (outcome !== "pending") {
      this.dispatchEvent(new Event(outcome));
    }
  });

  onTestFinished(() => setSource.mockRestore());
  return { urls };
}

describe("loadImage", () => {
  test("resolves with the image once it loads", async() => {
    const { urls } = stubImageLoads("load");
    const image = await loadImage("https://wimg/a.png");

    expect(image).toBeInstanceOf(HTMLImageElement);
    expect(urls).toEqual(["https://wimg/a.png"]);
  });

  test("rejects an image that fails to load", async() => {
    stubImageLoads("error");

    await expect(loadImage("https://wimg/a.png", new AbortController().signal)).rejects.toThrow("Could not load image: https://wimg/a.png");
  });

  test("rejects and stops loading when aborted", async() => {
    stubImageLoads("pending");
    const controller = new AbortController();
    const loading = loadImage("https://wimg/a.png", controller.signal);

    controller.abort();
    await expect(loading).rejects.toThrow("Image load aborted");
  });

  test("never starts an image already aborted", async() => {
    const { urls } = stubImageLoads("load");
    const controller = new AbortController();

    controller.abort();
    await expect(loadImage("https://wimg/a.png", controller.signal)).rejects.toThrow("Image load aborted");
    expect(urls).toEqual([]);
  });
});

describe("decodeBitmap", () => {
  test("decodes the source with the browser API", async() => {
    const bitmap = { close: vi.fn() } as unknown as ImageBitmap;
    const createImageBitmap = vi.fn<(source: ImageBitmapSource) => Promise<ImageBitmap>>(() => Promise.resolve(bitmap));
    const source = new Blob(["image bytes"]);

    vi.stubGlobal("createImageBitmap", createImageBitmap);
    onTestFinished(() => {
      vi.unstubAllGlobals();
    });

    await expect(decodeBitmap(source)).resolves.toBe(bitmap);
    expect(createImageBitmap).toHaveBeenCalledExactlyOnceWith(source);
  });
});
