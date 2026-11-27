import { Mock, afterEach, describe, expect, test, vi } from "vitest";
import { APP_STORAGE_SCHEMA } from "@/core/app/storage/app_storage_schema";
import { DEFAULT_LIGHTBOX_KEY_BINDINGS } from "@/core/features/lightbox/commands/default_lightbox_key_bindings";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoriteAddResult } from "@/core/features/favorites/actions/favorite_add_result";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { Lightbox } from "@/core/features/lightbox/lightbox";
import { MediaSequence } from "@/core/features/lightbox/navigation/media_sequence";
import { MemoryClipboard } from "@/adapters/memory/ports/clipboard/memory_clipboard";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { MemoryViewport } from "@/adapters/memory/ports/viewport/memory_viewport";
import { Signal } from "@/core/utils/reactive/signal";
import { StringInterner } from "@/core/utils/string/string_interner";
import { createFavoritesLightbox } from "@/core/app/favorites/lightbox/favorites_lightbox";
import { createPost } from "@/testing/post";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { render } from "@/core/ui/h/h";

const LONGER_THAN_ANY_DELAY = 60_000;
const MEDIA_SEQUENCE: MediaSequence<Favorite> = {
  getNext: () => Promise.resolve(undefined),
  getPrevious: () => Promise.resolve(undefined),
  getNeighbors: () => Promise.resolve([]),
  positionOf: () => undefined
};

interface Setup {
  lightbox: Lightbox<Favorite>;
  favorite: Favorite;
  scheduler: MemoryScheduler;
  turnToPageContaining: Mock<(favorite: Favorite) => void>;
  reveal: Mock<(favorite: Favorite) => HTMLElement | undefined>;
  add: Mock<(favoriteId: string) => Promise<FavoriteAddResult>>;
}

function setup(): Setup {
  const post = createPost({ id: "1", media: { kind: "image", locator: "image.jpg" } });
  const favorite: Favorite = new FavoritesCollection(new StringInterner()).append([post])[0]!;
  const scheduler = new MemoryScheduler();
  const turnToPageContaining = vi.fn<(favorite: Favorite) => void>();
  const reveal = vi.fn<(favorite: Favorite) => HTMLElement | undefined>();
  const add = vi.fn<(favoriteId: string) => Promise<FavoriteAddResult>>(() => Promise.resolve("added"));
  const lightbox = createFavoritesLightbox({
    scheduler, sizeObserver: new MemorySizeObserver(), viewport: new MemoryViewport(), remoteMedia: new MemoryRemoteMedia(),
    actions: { openPostPage: vi.fn(), openOriginal: vi.fn(), download: vi.fn() },
    preferences: createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["favorites"]).favorites.lightbox,
    lightboxKeyBindings: new Signal({ ...DEFAULT_LIGHTBOX_KEY_BINDINGS, addFavorite: ["e"] }),
    clipboard: new MemoryClipboard(),
    localTagCategories: { getMany: () => Promise.resolve(new Map()) },
    favoritesService: {
      isFavorited: () => false,
      actions: { add, remove: (): Promise<boolean> => Promise.resolve(true) }
    },
    favoritesWorkspace: { locate: () => undefined, turnToPageContaining, reveal }
  });
  return { lightbox, favorite, scheduler, turnToPageContaining, reveal, add };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("createFavoritesLightbox", () => {
  test("turns the workspace to the page holding the favorite it settles on", () => {
    const { lightbox, favorite, scheduler, turnToPageContaining } = setup();

    lightbox.open(MEDIA_SEQUENCE, favorite);
    scheduler.advance(LONGER_THAN_ANY_DELAY);
    expect(turnToPageContaining).toHaveBeenCalledWith(favorite);
  });

  test("adds the favorite it shows through the favorites service", () => {
    const { lightbox, favorite, add } = setup();
    const { result: view } = render(document, () => lightbox.createView());

    document.body.append(view);
    lightbox.open(MEDIA_SEQUENCE, favorite);
    view.dispatchEvent(new KeyboardEvent("keydown", { key: "e" }));
    expect(add).toHaveBeenCalledWith(favorite.id);
  });

  test("reveals the favorite it closes on", () => {
    const { lightbox, favorite, reveal } = setup();
    const { result: view } = render(document, () => lightbox.createView());

    document.body.append(view);
    lightbox.open(MEDIA_SEQUENCE, favorite);
    view.dispatchEvent(new MouseEvent("mousedown", { button: 2, bubbles: true, view: window }));
    expect(reveal).toHaveBeenCalledWith(favorite);
  });
});
