import { DEFAULT_SKELETON_DIMENSIONS, SkeletonGridClass } from "@/core/ui/post_grid/skeleton";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { ActivityBarClass } from "@/core/ui/components/activity_bar/activity_bar";
import { AppRootClass } from "@/core/ui/app_root/app_root";
import { Emitter } from "@/core/utils/reactive/emitter";
import { LightboxButtonClass } from "@/core/features/lightbox/ui/chrome/button";
import { LightboxPositionClass } from "@/core/features/lightbox/ui/chrome/position";
import { LightboxViewportClass } from "@/core/features/lightbox/ui/media/viewport";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryFileSaver } from "@/adapters/memory/ports/file_saver/file_saver";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/host_page";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/navigator";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/size_observer";
import { PageSlotClass } from "@/core/ui/components/paginator/page_slot";
import { Post } from "@/core/domain/post/post";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { SwitchClass } from "@/core/ui/components/switch/switch";
import { TileClass } from "@/core/ui/post_grid/tile";
import { composeFavoritesApp } from "@/core/app/favorites/composer";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";

function mount(localKeyedValues = new MemoryLocalKeyedValues(), posts: Post[] = [], {
  navigator = new MemoryNavigator(),
  fileSaver = new MemoryFileSaver(),
  scheduler = new MemoryScheduler(),
  pageVisibility = { hidden: new Emitter<void>() },
  hostPage = new MemoryHostPage()
} = {}): ShadowRoot {
  const container = document.createElement("div");
  const client = new MemoryClient(posts);

  composeFavoritesApp({ userOwnsFavorites: true, blacklistedTags: [], favoritesOwnerId: "1", colorScheme: "dark" }, {
    localFavorites: new MemoryLocalFavorites(),
    localPosts: new MemoryLocalPosts(),
    localTagCategories: new MemoryLocalTagCategories(),
    remoteFavorites: new MemoryRemoteFavorites(client),
    remotePosts: new MemoryRemotePosts(client),
    remoteMedia: new MemoryRemoteMedia(),
    visibilityObserver: { observe: () => (): void => { } },
    sizeObserver: new MemorySizeObserver(),
    remotePages: new MemoryRemotePages(),
    scheduler,
    randomSource: new MemoryRandomSource(),
    localKeyedValues,
    navigator,
    fileSaver,
    pageVisibility,
    hostPage
  }).mount(container);
  return container.shadowRoot!;
}

function findStandIn(): HTMLCanvasElement | null {
  return document.body.querySelector<HTMLCanvasElement>(":scope > canvas");
}

function readAspectRatios(grid: Element): string[] {
  return [...grid.querySelectorAll<HTMLElement>(`.${TileClass.root}`)].map(tile => tile.style.getPropertyValue("--fsg-Tile-aspect-ratio"));
}

function querySkeleton(root: ShadowRoot): Element {
  return root.querySelector(`.${SkeletonGridClass.root}`)!;
}

function clickLightboxButton(root: ShadowRoot, label: string): void {
  root.querySelector<HTMLElement>(`.${LightboxButtonClass.root}[aria-label="${label}"]`)!.click();
}

function clickSettingsSwitch(root: ShadowRoot, label: string): void {
  [...root.querySelectorAll<HTMLButtonElement>(`.${SwitchClass.root}`)]
    .find(control => control.ariaLabelledByElements?.[0]?.textContent === label)!
    .click();
}

function pressKey(root: ShadowRoot, key: string): void {
  root.querySelector("dialog")!.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

function tapViewport(root: ShadowRoot, modifiers: { ctrlKey?: boolean } = {}): void {
  const viewport = root.querySelector(`.${LightboxViewportClass.root}`)!;

  viewport.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, isPrimary: true, ...modifiers }));
  viewport.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, isPrimary: true, ...modifiers }));
}

describe("composeFavoritesApp", () => {
  test("mounts the favorites screen in the app root inside the container", () => {
    const app = mount().querySelector<HTMLElement>(`.${AppRootClass.root}`)!;

    expect(app.style.colorScheme).toBe("dark");
    expect(app.querySelector("input[type=search]")).not.toBeNull();
  });

  test("uses the tiles per row kept in the favorites preferences, not the post list's", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery", { preferences: { favorites: { tilesPerRow: 4 }, postList: { tilesPerRow: 7 } } });
    const grid = mount(localKeyedValues).querySelector<HTMLElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root})`)!;

    expect(grid.style.getPropertyValue("--fsg-PostGrid-tilesPerRow")).toBe("4");
  });

  test("stores infinite scroll when it is switched on in the Settings tool", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const root = mount(localKeyedValues);

    root.querySelector<HTMLButtonElement>(`.${ActivityBarClass.item}[aria-label="Settings"]`)!.click();
    clickSettingsSwitch(root, "Infinite scroll");

    expect(localKeyedValues.get("favorites-search-gallery")).toMatchObject({ preferences: { favorites: { infiniteScroll: true } } });
  });

  test("hides the site header when it is switched off in the Settings tool", () => {
    const hostPage = new MemoryHostPage(true);
    const root = mount(new MemoryLocalKeyedValues(), [], { hostPage });

    root.querySelector<HTMLButtonElement>(`.${ActivityBarClass.item}[aria-label="Settings"]`)!.click();
    expect(hostPage.headerVisible).toBe(true);
    clickSettingsSwitch(root, "Site header");
    expect(hostPage.headerVisible).toBe(false);
  });

  test("hides the site header on mount when it was switched off before", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const hostPage = new MemoryHostPage(true);

    localKeyedValues.set("favorites-search-gallery", { preferences: { favorites: { siteHeaderVisible: false } } });
    mount(localKeyedValues, [], { hostPage });
    expect(hostPage.headerVisible).toBe(false);
  });

  test("records the shapes of the active tab's results for the next load's skeleton when the page is hidden", async() => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const pageVisibility = { hidden: new Emitter<void>() };
    const posts = [createPost({ id: "1", width: 300, height: 200 }), createPost({ id: "2", width: 100, height: 400 })];

    mount(localKeyedValues, posts, { pageVisibility });
    await flushMicrotasks();
    expect(localKeyedValues.get("favorites-search-gallery")).not.toHaveProperty("favoritesSkeleton");
    pageVisibility.hidden.emit();
    expect(localKeyedValues.get("favorites-search-gallery")).toMatchObject({
      favoritesSkeleton: { 1: [{ width: 300, height: 200 }, { width: 100, height: 400 }] }
    });
  });

  test("draws the skeleton recorded for the favorites' owner", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery", { favoritesSkeleton: { 1: [{ width: 4, height: 3 }] } });
    expect(readAspectRatios(querySkeleton(mount(localKeyedValues)))).toEqual(["4 / 3"]);
  });

  test("draws the default skeleton when only another owner's skeleton is recorded", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery", { favoritesSkeleton: { 2: [{ width: 4, height: 3 }] } });
    const ratios = readAspectRatios(querySkeleton(mount(localKeyedValues)));

    expect(ratios).not.toHaveLength(0);
    expect(new Set(ratios)).toEqual(new Set(DEFAULT_SKELETON_DIMENSIONS.map(({ width, height }) => `${width} / ${height}`)));
  });

  test("reveals the lightbox's last favorite before scrolling to its tile", async() => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const previousScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
    const scrolls: Array<{ target: HTMLElement; shown: Element | null; page: string | null }> = [];

    localKeyedValues.set("favorites-search-gallery", { preferences: { favorites: { pageSize: 1 } } });
    const media = { kind: "image" as const, locator: "data:image/png;base64,AA==" };
    const root = mount(localKeyedValues, [createPost({ id: "1", media }), createPost({ id: "2", media })]);
    const grid = root.querySelector<HTMLElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root})`)!;

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value(this: HTMLElement): void {
        scrolls.push({
          target: this,
          shown: grid.querySelector(`.${TileClass.root}`),
          page: root.querySelector(`.${PageSlotClass.page}[aria-current="page"]`)?.textContent ?? null
        });
      }
    });
    onTestFinished(() => {
      if (previousScrollIntoView === undefined) {
        Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
      } else {
        Object.defineProperty(HTMLElement.prototype, "scrollIntoView", previousScrollIntoView);
      }
    });

    await flushMicrotasks();
    const firstTile = grid.querySelector(`.${TileClass.root}`)!;

    firstTile.querySelector<HTMLAnchorElement>(`.${TileClass.link}`)!.click();
    pressKey(root, "ArrowRight");
    await flushMicrotasks();
    clickLightboxButton(root, "Close");

    expect(scrolls).toHaveLength(1);
    expect(scrolls[0].page).toBe("2");
    expect(scrolls[0].target).toBe(scrolls[0].shown);
    expect(scrolls[0].target).not.toBe(firstTile);
  });

  test("switches the grid to the lightbox favorite's page once it settles, while the lightbox stays open", async() => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const scheduler = new MemoryScheduler();

    localKeyedValues.set("favorites-search-gallery", { preferences: { favorites: { pageSize: 1 } } });
    const root = mount(localKeyedValues, [createPost({ id: "1" }), createPost({ id: "2" }), createPost({ id: "3" })], { scheduler });
    const readPage = (): string | null | undefined => root.querySelector(`.${PageSlotClass.page}[aria-current="page"]`)?.textContent;

    await flushMicrotasks();
    root.querySelector<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)!.click();
    pressKey(root, "ArrowRight");
    await flushMicrotasks();
    scheduler.advance(74);
    pressKey(root, "ArrowRight");
    await flushMicrotasks();
    scheduler.advance(74);
    expect(readPage()).toBe("1");
    scheduler.advance(1);
    expect([readPage(), root.querySelector("dialog")!.open]).toEqual(["3", true]);
  });

  test.each([
    { infiniteScroll: false, position: "1 / 2" },
    { infiniteScroll: true, position: "2 / 2" }
  ])("steps the lightbox past the last result to position $position when infinite scroll is $infiniteScroll", async({ infiniteScroll, position }) => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery", { preferences: { favorites: { pageSize: 50, infiniteScroll } } });
    const root = mount(localKeyedValues, [createPost({ id: "1" }), createPost({ id: "2" })]);

    await flushMicrotasks();
    root.querySelectorAll<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)[1].click();
    pressKey(root, "ArrowRight");
    await flushMicrotasks();
    expect(root.querySelector(`.${LightboxPositionClass.root}`)!.textContent).toBe(position);
  });

  test("morphs the lightbox's media into its favorite's tile on close", async() => {
    const scheduler = new MemoryScheduler();
    const posts = [createPost({ id: "1", media: { kind: "image", locator: "data:image/png;base64,AA==" } })];
    const root = mount(new MemoryLocalKeyedValues(), posts, { scheduler });

    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 0);
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 100));
    onTestFinished(() => {
      findStandIn()?.remove();
      vi.restoreAllMocks();
    });
    await flushMicrotasks();
    const tile = root.querySelector<HTMLElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.root}`)!;

    tile.querySelector<HTMLAnchorElement>(`.${TileClass.link}`)!.click();
    scheduler.advance(75);
    await flushMicrotasks();
    clickLightboxButton(root, "Close");
    expect([findStandIn() !== null, tile.style.visibility]).toEqual([true, "hidden"]);
  });

  test("closes plainly without a morph while the lightbox's media is still loading", async() => {
    const root = mount(new MemoryLocalKeyedValues(), [createPost({ id: "1" })]);

    await flushMicrotasks();
    root.querySelector<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)!.click();
    clickLightboxButton(root, "Close");
    expect([findStandIn(), root.querySelector("dialog")!.open]).toEqual([null, false]);
  });

  test("opens a favorite's original when its tile is Ctrl-clicked", async() => {
    const navigator = new MemoryNavigator();
    const posts = [createPost({ id: "1", media: { kind: "image", locator: "https://originals/1.png" } })];
    const root = mount(new MemoryLocalKeyedValues(), posts, { navigator });

    await flushMicrotasks();
    root.querySelector(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)!
      .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }));
    await flushMicrotasks();
    expect(navigator.opened).toEqual(["https://originals/1.png"]);
    expect(root.querySelector("dialog")!.open).toBe(false);
  });

  test("opens the lightbox favorite's original on a Ctrl tap and its post on a middle click", async() => {
    const navigator = new MemoryNavigator();
    const posts = [createPost({ id: "1", media: { kind: "image", locator: "https://originals/1.png" } })];
    const root = mount(new MemoryLocalKeyedValues(), posts, { navigator });

    await flushMicrotasks();
    root.querySelector<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)!.click();
    const dialog = root.querySelector("dialog")!;

    tapViewport(root, { ctrlKey: true });
    dialog.dispatchEvent(new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));
    await flushMicrotasks();
    expect([navigator.opened, dialog.open]).toEqual([["#post-1", "https://originals/1.png"], true]);
  });

  test("saves the lightbox favorite's original, named by its id, from the download button", async() => {
    const fileSaver = new MemoryFileSaver();
    const root = mount(new MemoryLocalKeyedValues(), [createPost({ id: "1" })], { fileSaver });

    await flushMicrotasks();
    root.querySelector<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)!.click();
    clickLightboxButton(root, "Download");
    await flushMicrotasks();
    expect(fileSaver.saved.map(saved => saved.name)).toEqual(["1"]);
  });
});
