import { AddFavoriteStatus, FavoritesEditor, RemoveFavoriteStatus } from "@/core/boundary/ports";
import { MediaItem, MediaType } from "@/types/media";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GalleryModel } from "@/features/gallery/model/model";
import { MemoryNavigation } from "@/adapters/memory/navigation/navigation";
import { UpscaleQuality } from "@/types/app";
import { createPreferences } from "@/testing/preferences";

interface Setup {
  model: GalleryModel;
  items: MediaItem[];
  navigation: MemoryNavigation;
  favoritesEditor: { add: ReturnType<typeof vi.fn<FavoritesEditor["add"]>>; remove: ReturnType<typeof vi.fn<FavoritesEditor["remove"]>> };
}

function createItem(id: string, mediaType: MediaType = "image"): MediaItem {
  return { id, mediaType, extension: "png", thumbUrl: `https://rule34.xxx/thumbnails/1/thumbnail_${id}.jpg` };
}

function createModel(previewEnabled = false): GalleryModel {
  return setupWith(previewEnabled).model;
}

function setupWith(previewEnabled: boolean): Omit<Setup, "items"> {
  const navigation = new MemoryNavigation();
  const favoritesEditor = {
    add: vi.fn<FavoritesEditor["add"]>((): Promise<AddFavoriteStatus> => Promise.resolve("alreadyAdded")),
    remove: vi.fn<FavoritesEditor["remove"]>((): Promise<RemoveFavoriteStatus> => new Promise(() => { }))
  };
  return { model: new GalleryModel(createPreferences({ gallery: { previewEnabled } }), navigation, favoritesEditor), navigation, favoritesEditor };
}

function setup(...ids: string[]): Setup {
  const { model, navigation, favoritesEditor } = setupWith(false);
  const items = ids.map(id => createItem(id));

  model.indexItems(items);
  return { model, items, navigation, favoritesEditor };
}

function stubFetch(response: () => Promise<Response>): ReturnType<typeof vi.fn> {
  const fetch = vi.fn(response);

  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("GalleryModel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("state", () => {
    test("starts idle, or previewing when previews are enabled", () => {
      expect(createModel().isIdle()).toBe(true);
      expect(createModel(true).isShowingPreviews()).toBe(true);
    });

    test("opening points at the item and enters the gallery; closing leaves it", () => {
      const { model, items } = setup("1", "2", "3");

      model.open(items[1]);
      expect(model.isInGallery()).toBe(true);
      expect(model.getCurrentState()).toBe("open");
      expect(model.currentItem()).toBe(items[1]);

      model.close();
      expect(model.isIdle()).toBe(true);
    });

    test("toggling previews does not leave an open gallery", () => {
      const { model, items } = setup("1");

      model.preview(true);
      expect(model.isShowingPreviews()).toBe(true);
      model.open(items[0]);
      model.preview(false);
      expect(model.isInGallery()).toBe(true);
    });
  });

  describe("navigation", () => {
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

    test("re-indexing replaces the navigable items", () => {
      const { model } = setup("1", "2");
      const replacement = createItem("9");

      model.indexItems([replacement]);
      model.open(replacement);
      expect(model.currentItem()).toBe(replacement);
    });
  });

  describe("preload window", () => {
    const items = ["1", "2", "3"].map(id => createItem(id));

    test("is empty until a window is set up", () => {
      expect(createModel().getItemsAround("1")).toEqual([]);
    });

    test("a wrapping window reaches around the ends", () => {
      const model = createModel();

      model.setupWrappingWindow(() => items, item => item);
      expect(model.getItemsAround("1").map(item => item.id).sort()).toEqual(["1", "2", "3"]);
    });

    test("a clamped window maps each item it covers", () => {
      const model = createModel();

      model.setupClampedWindow(() => items, item => ({ ...item, id: `mapped_${item.id}` }));
      expect(model.getItemsAround("2").map(item => item.id).sort()).toEqual(["mapped_1", "mapped_2", "mapped_3"]);
    });
  });

  describe("upscale quality", () => {
    test("maps the thumb-to-viewport ratio through the configured cutoffs", () => {
      expect(createModel().upscaleQualityFor(50, 1000)).toBe(UpscaleQuality.Low);
      expect(createModel().upscaleQualityFor(500, 1000)).toBe(UpscaleQuality.Ultra);
    });

    test("is null when nothing can be measured", () => {
      expect(createModel().upscaleQualityFor(0, 1000)).toBeNull();
    });
  });

  describe("actions on the current item", () => {
    test("knows whether the current item is a video", () => {
      const model = createModel();
      const video = createItem("1", "video");

      model.indexItems([video, createItem("2")]);
      model.open(video);
      expect(model.isViewingVideo()).toBe(true);
      model.move("ArrowRight");
      expect(model.isViewingVideo()).toBe(false);
    });

    test("opens the current item's post and media", () => {
      const { model, items, navigation } = setup("101");

      model.open(items[0]);
      model.openPost();
      model.openMedia();
      expect(navigation.opened).toEqual(["#post-101", "#media-101"]);
    });

    test("downloads the original media", async() => {
      const fetch = stubFetch(() => new Promise(() => { }));
      const { model, items } = setup("103");

      model.open(items[0]);
      await model.download();
      expect(fetch).toHaveBeenCalledWith("https://rule34.xxx/images/1/103.png");
    });

    test("adds the current item as a favorite and reports the answer", async() => {
      const { model, items, favoritesEditor } = setup("104");

      model.open(items[0]);
      expect(await model.addFavorite()).toBe("alreadyAdded");
      expect(favoritesEditor.add).toHaveBeenCalledWith("104");
    });

    test("removes the current item from favorites without waiting for the answer", async() => {
      const { model, items, favoritesEditor } = setup("105");

      model.open(items[0]);
      expect(await model.removeFavorite()).toBe("success");
      expect(favoritesEditor.remove).toHaveBeenCalledWith("105");
    });
  });
});
