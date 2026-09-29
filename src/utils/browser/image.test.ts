import { afterEach, describe, expect, test, vi } from "vitest";
import { loadImageBitmap } from "@/utils/browser/image";

const BITMAP = { width: 1 } as ImageBitmap;

function setup(): { images: HTMLImageElement[]; decoded: ReturnType<typeof vi.fn> } {
  const images: HTMLImageElement[] = [];
  const decoded = vi.fn(() => Promise.resolve(BITMAP));

  vi.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(function setSource(this: HTMLImageElement, url: string) {
    this.setAttribute("src", url);
    images.push(this);
  });
  vi.stubGlobal("createImageBitmap", decoded);
  return { images, decoded };
}

describe("loadImageBitmap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("decodes the image once it loads", async() => {
    const { images, decoded } = setup();
    const loading = loadImageBitmap("https://host/a.png");

    images[0].dispatchEvent(new Event("load"));
    expect(await loading).toBe(BITMAP);
    expect(decoded).toHaveBeenCalledWith(images[0]);
    expect(images[0].getAttribute("src")).toBe("https://host/a.png");
  });

  test("rejects an image that fails to load", async() => {
    const { images } = setup();
    const loading = loadImageBitmap("https://host/a.png");

    images[0].dispatchEvent(new Event("error"));
    await expect(loading).rejects.toThrow("https://host/a.png");
  });

  test("abandons the load when aborted", async() => {
    const { images, decoded } = setup();
    const controller = new AbortController();
    const loading = loadImageBitmap("https://host/a.png", controller.signal);

    controller.abort();
    await expect(loading).rejects.toMatchObject({ name: "AbortError" });
    expect(images[0].hasAttribute("src")).toBe(false);
    expect(decoded).not.toHaveBeenCalled();
  });

  test("never loads when already aborted", async() => {
    const { images } = setup();
    const controller = new AbortController();

    controller.abort();
    await expect(loadImageBitmap("https://host/a.png", controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(images).toHaveLength(0);
  });
});
