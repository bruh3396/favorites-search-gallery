import { TileClass, createTile } from "@/core/ui/post_grid/tile";
import { describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";

const IMAGE: MediaItem = { id: "123", media: { kind: "image", locator: "images/123" } };
const PLACEHOLDER: MediaItem = { id: "456", media: { kind: "image", locator: "" } };
const PORTRAIT = { width: 1_200, height: 1_800 };
const UNKNOWN = { width: 0, height: 0 };

function resolvePreviewUrl(media: Media): Promise<string> {
  return Promise.resolve(`https://preview/${media.locator}`);
}

function getPreview(tile: HTMLElement): HTMLImageElement {
  return tile.querySelector(`.${TileClass.link} > .${TileClass.preview}`)!;
}

function readAspectRatio(tile: HTMLElement): string {
  return tile.style.getPropertyValue("--fsg-Tile-aspect-ratio");
}

describe("createTile", () => {
  test("draws the post as a linked preview", () => {
    const tile = createTile(document, { post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl });

    expect(tile.className).toBe(TileClass.root);
    expect(tile.dataset.mediaKind).toBe("image");
    expect(getPreview(tile)).not.toBeNull();
  });

  test("puts its actions beside the link", () => {
    const action = document.createElement("button");
    const tile = createTile(document, { post: IMAGE, dimensions: PORTRAIT, actions: [action], resolvePreviewUrl });

    expect(action.parentElement?.className).toBe(TileClass.actions);
    expect(action.closest(`.${TileClass.link}`)).toBeNull();
    expect(tile.contains(action)).toBe(true);
  });

  test("holds the post's shape before the preview arrives", () => {
    expect(readAspectRatio(createTile(document, { post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl }))).toBe("1200 / 1800");
  });

  test("leaves the shape to the stylesheet while the dimensions are unknown", () => {
    expect(readAspectRatio(createTile(document, { post: PLACEHOLDER, dimensions: UNKNOWN, actions: [], resolvePreviewUrl }))).toBe("");
  });

  test("shows the preview and stops loading once it resolves", async() => {
    const tile = createTile(document, { post: IMAGE, dimensions: PORTRAIT, actions: [], resolvePreviewUrl });

    expect(tile.dataset.loading).toBe("");
    await vi.waitFor(() => expect(tile.dataset.loading).toBeUndefined());
    expect(getPreview(tile).src).toBe("https://preview/images/123");
  });

  test("stays loading without a preview for a placeholder", async() => {
    const resolve = vi.fn(resolvePreviewUrl);
    const tile = createTile(document, { post: PLACEHOLDER, dimensions: UNKNOWN, actions: [], resolvePreviewUrl: resolve });

    await Promise.resolve();
    expect(resolve).not.toHaveBeenCalled();
    expect(tile.dataset.loading).toBe("");
    expect(getPreview(tile).hasAttribute("src")).toBe(false);
  });
});
