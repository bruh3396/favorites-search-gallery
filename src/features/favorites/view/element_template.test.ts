import { afterEach, describe, expect, test, vi } from "vitest";
import { Favorite } from "@/types/favorite";
import { FavoritesElementTemplate } from "@/features/favorites/view/element_template";
import { flushMicrotasks } from "@/testing/async";

interface Setup {
  template: FavoritesElementTemplate;
  thumb: HTMLElement;
  image: HTMLImageElement;
  decode: (outcome: "loaded" | "failed") => void;
}

function createFavorite(id: string): Favorite {
  return { id, media: { kind: "image", locator: `1/${id}.png` }, isNew: false, post: { width: 100, height: 200 } } as unknown as Favorite;
}

function setup(): Setup {
  const decodes: { resolve: () => void; reject: (error: Error) => void }[] = [];

  vi.spyOn(HTMLImageElement.prototype, "decode").mockImplementation(() => new Promise((resolve, reject) => decodes.push({ resolve, reject })));
  const template = new FavoritesElementTemplate(true, false, true, id => `#post-${id}`, media => Promise.resolve(`preview:${media.locator}`));
  const thumb = template.createBlankThumb();
  const image = thumb.querySelector("img") as HTMLImageElement;
  const decode = (outcome: "loaded" | "failed"): void => {
    const pending = decodes.shift();

    if (outcome === "loaded") {
      pending?.resolve();
    } else {
      pending?.reject(new Error("broken"));
    }
  };
  return { template, thumb, image, decode };
}

describe("FavoritesElementTemplate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("marks a thumb as loading until its preview is decoded", async() => {
    const { template, thumb, image, decode } = setup();

    template.bindThumb(thumb, createFavorite("1"), false);
    expect(thumb.dataset.loading).toBeDefined();
    await flushMicrotasks();
    expect(image.getAttribute("src")).toBe("preview:1/1.png");
    decode("loaded");
    await flushMicrotasks();
    expect(thumb.dataset.loading).toBeUndefined();
  });

  test("stops loading when the preview fails", async() => {
    const { template, thumb, decode } = setup();

    template.bindThumb(thumb, createFavorite("1"), false);
    await flushMicrotasks();
    decode("failed");
    await flushMicrotasks();
    expect(thumb.dataset.loading).toBeUndefined();
  });

  test("a thumb rebound mid-load keeps loading for its new favorite", async() => {
    const { template, thumb, image, decode } = setup();

    template.bindThumb(thumb, createFavorite("1"), false);
    await flushMicrotasks();
    template.bindThumb(thumb, createFavorite("2"), false);
    decode("loaded");
    await flushMicrotasks();
    expect(thumb.dataset.loading).toBeDefined();
    expect(image.getAttribute("src")).toBe("preview:1/2.png");
  });

  test("never gives a preview an empty source or a broken-image icon", () => {
    const { template, thumb, image } = setup();

    template.bindThumb(thumb, createFavorite("1"), false);
    expect(image.hasAttribute("src")).toBe(false);
    expect(image.getAttribute("alt")).toBe("");
  });
});
