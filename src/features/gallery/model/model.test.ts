import { AddFavoriteResult, RemoteFavoriteActions, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { Media, MediaKind } from "@/core/domain/media/media";
import { describe, expect, test, vi } from "vitest";
import { GalleryModel } from "@/features/gallery/model/model";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/navigator";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";
import { MediaItem } from "@/core/domain/post/post";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { UpscaleQuality } from "@/types/app";
import { createPreferences } from "@/testing/preferences";

interface Setup {
  model: GalleryModel;
  items: MediaItem[];
  navigator: MemoryNavigator;
  remoteFavoriteActions: { add: ReturnType<typeof vi.fn<RemoteFavoriteActions["add"]>>; remove: ReturnType<typeof vi.fn<RemoteFavoriteActions["remove"]>> };
  blobsRequested: Media[];
}

function createRemoteMedia(blobsRequested: Media[]): Pick<RemoteMedia, "resolveOriginalUrl" | "fetchOriginal"> {
  return {
    resolveOriginalUrl: (media): Promise<string> => Promise.resolve(`original:${media.locator}`),
    fetchOriginal: (media): Promise<Blob> => {
      blobsRequested.push(media);
      return new Promise(() => { });
    }
  };
}

function createItem(id: string, kind: MediaKind = "image"): MediaItem {
  return { id, media: { kind, locator: `1/${id}.png` } };
}

function createModel(previewEnabled = false): GalleryModel {
  return setupWith(previewEnabled).model;
}

function setupWith(previewEnabled: boolean): Omit<Setup, "items"> {
  const navigator = new MemoryNavigator();
  const remoteFavoriteActions = {
    add: vi.fn<RemoteFavoriteActions["add"]>((): Promise<AddFavoriteResult> => Promise.resolve("alreadyAdded")),
    remove: vi.fn<RemoteFavoriteActions["remove"]>((): Promise<RemoveFavoriteResult> => new Promise(() => { }))
  };
  const blobsRequested: Media[] = [];
  const model = new GalleryModel(createPreferences({ gallery: { previewEnabled } }), {
    navigator,
    remotePages: new MemoryRemotePages(),
    remoteFavoriteActions,
    remoteMedia: createRemoteMedia(blobsRequested)
  });
  return { model, navigator, remoteFavoriteActions, blobsRequested };
}

function setup(...ids: string[]): Setup {
  const { model, navigator, remoteFavoriteActions, blobsRequested } = setupWith(false);
  const items = ids.map(id => createItem(id));

  model.indexItems(items);
  return { model, items, navigator, remoteFavoriteActions, blobsRequested };
}

const PRELOAD_ITEMS = ["1", "2", "3"].map(id => createItem(id));

describe("GalleryModel", () => {
  test("starts idle, or previewing when previews are enabled", () => {
    expect(createModel().isIdle()).toBe(true);
    expect(createModel(true).isShowingPreviews()).toBe(true);
  });

  test("enters the gallery at the opened item and leaves it on close", () => {
    const { model, items } = setup("1", "2", "3");

    model.open(items[1]);
    expect(model.isInGallery()).toBe(true);
    expect(model.getCurrentState()).toBe("open");
    expect(model.currentItem()).toBe(items[1]);

    model.close();
    expect(model.isIdle()).toBe(true);
  });

  test("stays in an open gallery when previews are toggled", () => {
    const { model, items } = setup("1");

    model.preview(true);
    expect(model.isShowingPreviews()).toBe(true);
    model.open(items[0]);
    model.preview(false);
    expect(model.isInGallery()).toBe(true);
  });

  test("moves between items and reports the boundary it hits", () => {
    const { model, items } = setup("1", "2", "3");

    model.open(items[0]);
    expect(model.move("ArrowRight")).toBe("none");
    expect(model.currentItem()).toBe(items[1]);
    expect(model.move("ArrowLeft")).toBe("none");
    expect(model.move("ArrowLeft")).toBe("start");
    expect(model.currentItem()).toBe(items[0]);
  });

  test("jumps to either end", () => {
    const { model, items } = setup("1", "2", "3");

    model.jumpToLast();
    expect(model.currentItem()).toBe(items[2]);
    expect(model.move("ArrowRight")).toBe("end");
    model.jumpToFirst();
    expect(model.currentItem()).toBe(items[0]);
  });

  test("replaces the navigable items on re-indexing", () => {
    const { model } = setup("1", "2");
    const replacement = createItem("9");

    model.indexItems([replacement]);
    model.open(replacement);
    expect(model.currentItem()).toBe(replacement);
  });

  test("finds no items around an id until a preload window is set up", () => {
    expect(createModel().getItemsAround("1")).toEqual([]);
  });

  test("reaches around the ends with a wrapping preload window", () => {
    const model = createModel();

    model.setupWrappingWindow(() => PRELOAD_ITEMS);
    expect(model.getItemsAround("1").map(item => item.id)).toEqual(["1", "3", "2"]);
  });

  test("stops at the ends with a clamped preload window", () => {
    const model = createModel();

    model.setupClampedWindow(() => PRELOAD_ITEMS);
    expect(model.getItemsAround("1").map(item => item.id)).toEqual(["1", "2", "3"]);
  });

  test("maps the thumb-to-viewport ratio through the configured upscale cutoffs", () => {
    expect(createModel().upscaleQualityFor(50, 1_000)).toBe(UpscaleQuality.Low);
    expect(createModel().upscaleQualityFor(500, 1_000)).toBe(UpscaleQuality.Ultra);
  });

  test("gives no upscale quality when nothing can be measured", () => {
    expect(createModel().upscaleQualityFor(0, 1_000)).toBeNull();
  });

  test("knows whether the current item is a video", () => {
    const model = createModel();
    const video = createItem("1", "video");

    model.indexItems([video, createItem("2")]);
    model.open(video);
    expect(model.isViewingVideo()).toBe(true);
    model.move("ArrowRight");
    expect(model.isViewingVideo()).toBe(false);
  });

  test("opens the current item's post and original", async() => {
    const { model, items, navigator } = setup("101");

    model.open(items[0]);
    model.openPost();
    await model.openOriginal();
    expect(navigator.opened).toEqual(["#post-101", "original:1/101.png"]);
  });

  test("downloads the current item's original", () => {
    const { model, items, blobsRequested } = setup("103");

    model.open(items[0]);
    model.download();
    expect(blobsRequested).toEqual([items[0].media]);
  });

  test("adds the current item as a favorite and reports the answer", async() => {
    const { model, items, remoteFavoriteActions } = setup("104");

    model.open(items[0]);
    expect(await model.addFavorite()).toBe("alreadyAdded");
    expect(remoteFavoriteActions.add).toHaveBeenCalledWith("104");
  });

  test("removes the current item from favorites without waiting for the answer", async() => {
    const { model, items, remoteFavoriteActions } = setup("105");

    model.open(items[0]);
    expect(await model.removeFavorite()).toBe("removed");
    expect(remoteFavoriteActions.remove).toHaveBeenCalledWith("105");
  });
});
