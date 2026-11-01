import { describe, expect, onTestFinished, test, vi } from "vitest";
import { ActivityBarClass } from "@/core/ui/components/activity_bar/activity_bar";
import { AppRootClass } from "@/core/ui/app_root/app_root";
import { FavoritesAppClass } from "@/core/app/favorites/favorites_app";
import { LightboxButtonClass } from "@/core/features/lightbox/ui/chrome/lightbox_button";
import { LightboxPositionClass } from "@/core/features/lightbox/ui/chrome/lightbox_position";
import { LightboxViewportClass } from "@/core/features/lightbox/ui/media/lightbox_viewport";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryClipboard } from "@/adapters/memory/ports/clipboard/memory_clipboard";
import { MemoryFileSaver } from "@/adapters/memory/ports/file_saver/memory_file_saver";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/memory_host_page";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/memory_local_favorites";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/memory_local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/memory_local_tag_categories";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/memory_navigator";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/memory_remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/memory_remote_pages";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/memory_remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { MemoryViewport } from "@/adapters/memory/ports/viewport/memory_viewport";
import { PageSlotClass } from "@/core/ui/components/paginator/page_slot";
import { Post } from "@/core/domain/post/post";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { SegmentedClass } from "@/core/ui/components/segmented/segmented";
import { SkeletonGridClass } from "@/core/ui/post_grid/skeleton_grid";
import { SliderClass } from "@/core/ui/components/slider/slider";
import { SwitchClass } from "@/core/ui/components/switch/switch";
import { THEME_DEFINITIONS } from "@/core/ui/theme/theme";
import { TileClass } from "@/core/ui/post_grid/tile";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { composeFavoritesApp } from "@/core/app/favorites/favorites_app_composer";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/microtask_utilities";

const IDLE_VISIBILITY_OBSERVER: VisibilityObserver = { observe: () => (): void => { } };

function mount(localKeyedValues = new MemoryLocalKeyedValues(), posts: Post[] = [], {
  navigator = new MemoryNavigator(),
  fileSaver = new MemoryFileSaver(),
  scheduler = new MemoryScheduler(),
  hostPage = new MemoryHostPage(),
  visibilityObserver = IDLE_VISIBILITY_OBSERVER
} = {}): ShadowRoot {
  const container = document.createElement("div");
  const memoryClient = new MemoryClient(posts);

  composeFavoritesApp({ userOwnsFavorites: true, blacklistedTags: [], favoritesOwnerId: "1", colorScheme: "dark" }, {
    localFavorites: new MemoryLocalFavorites(),
    localPosts: new MemoryLocalPosts(),
    localTagCategories: new MemoryLocalTagCategories(),
    remoteFavorites: new MemoryRemoteFavorites(memoryClient),
    remotePosts: new MemoryRemotePosts(memoryClient),
    remoteMedia: new MemoryRemoteMedia(),
    visibilityObserver,
    sizeObserver: new MemorySizeObserver(),
    viewport: new MemoryViewport(),
    remotePages: new MemoryRemotePages(memoryClient),
    scheduler,
    randomSource: new MemoryRandomSource(),
    localKeyedValues,
    navigator,
    fileSaver,
    clipboard: new MemoryClipboard(),
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

function openThemeMenu(root: ShadowRoot): void {
  root.querySelector<HTMLButtonElement>(`.${ActivityBarClass.item}[aria-label="Settings"]`)!.click();
  [...root.querySelectorAll<HTMLElement>("[role=\"combobox\"]")].find(control => control.ariaLabelledByElements?.[0]?.textContent === "Theme")!.click();
}

function findThemeOption(root: ShadowRoot, label: string): HTMLElement {
  return [...root.querySelectorAll<HTMLElement>("[role=\"option\"]")].find(option => option.textContent === label)!;
}

function readThemeAccent(root: ShadowRoot): string {
  return root.querySelector<HTMLElement>(`.${AppRootClass.root}`)!.style.getPropertyValue("--fsg-theme-accent");
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

  test("uses the column count kept in the favorites preferences, not the post list's", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery:preferences", { favorites: { grid: { columnCount: 4 } }, postList: { grid: { columnCount: 7 } } });
    const grid = mount(localKeyedValues).querySelector<HTMLElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root})`)!;

    expect(grid.style.getPropertyValue("--fsg-GridTiler-columnCount")).toBe("4");
  });

  test("resizes the grid's tiles as the tile size slider in the Settings tool is dragged", () => {
    const root = mount();
    const grid = root.querySelector<HTMLElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root})`)!;

    root.querySelector<HTMLButtonElement>(`.${ActivityBarClass.item}[aria-label="Settings"]`)!.click();
    const slider = root.querySelector<HTMLInputElement>(`.${SliderClass.input}[aria-label="Size"]`)!;

    slider.value = "18";
    slider.dispatchEvent(new Event("input"));
    expect(grid.style.getPropertyValue("--fsg-GridTiler-columnCount")).toBe("1");
  });

  test("lays the grid out as picked in the Settings tool", () => {
    const root = mount();
    const grid = root.querySelector<HTMLElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root})`)!;

    root.querySelector<HTMLButtonElement>(`.${ActivityBarClass.item}[aria-label="Settings"]`)!.click();
    root.querySelector<HTMLButtonElement>(`.${SegmentedClass.option}[aria-label="Square"]`)!.click();
    expect(grid.dataset.layout).toBe("square");
  });

  test("stores HD tiles off when they are switched off in the Settings tool", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const root = mount(localKeyedValues);

    root.querySelector<HTMLButtonElement>(`.${ActivityBarClass.item}[aria-label="Settings"]`)!.click();
    clickSettingsSwitch(root, "HD");

    expect(localKeyedValues.get("favorites-search-gallery:preferences")).toMatchObject({ favorites: { grid: { hdTilesEnabled: false } } });
  });

  test("stores infinite scroll when it is switched on in the Settings tool", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const root = mount(localKeyedValues);

    root.querySelector<HTMLButtonElement>(`.${ActivityBarClass.item}[aria-label="Settings"]`)!.click();
    clickSettingsSwitch(root, "Infinite scroll");

    expect(localKeyedValues.get("favorites-search-gallery:preferences")).toMatchObject({ favorites: { pagination: { infiniteScroll: true } } });
  });

  test("stores the post list on with the preferences both apps read when it is switched on in the Settings tool", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const root = mount(localKeyedValues);

    root.querySelector<HTMLButtonElement>(`.${ActivityBarClass.item}[aria-label="Settings"]`)!.click();
    clickSettingsSwitch(root, "Enhance search pages");

    expect(localKeyedValues.get("favorites-search-gallery:preferences")).toMatchObject({ shared: { postListEnabled: true } });
  });

  test("hides the native header when it is switched off in the Settings tool", () => {
    const hostPage = new MemoryHostPage(true);
    const root = mount(new MemoryLocalKeyedValues(), [], { hostPage });

    root.querySelector<HTMLButtonElement>(`.${ActivityBarClass.item}[aria-label="Settings"]`)!.click();
    expect(hostPage.headerVisible).toBe(true);
    clickSettingsSwitch(root, "Header");
    expect(hostPage.headerVisible).toBe(false);
  });

  test("switches the app and the site to the color scheme picked in the Settings tool", () => {
    const hostPage = new MemoryHostPage();

    hostPage.colorScheme = "dark";
    const root = mount(new MemoryLocalKeyedValues(), [], { hostPage });

    root.querySelector<HTMLButtonElement>(`.${ActivityBarClass.item}[aria-label="Settings"]`)!.click();
    [...root.querySelectorAll<HTMLButtonElement>(`.${SegmentedClass.option}`)].find(option => option.getAttribute("aria-label") === "Light")!.click();
    expect([root.querySelector<HTMLElement>(`.${AppRootClass.root}`)!.style.colorScheme, hostPage.colorScheme]).toEqual(["light", "light"]);
  });

  test("applies and stores the theme picked in the Settings tool", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const root = mount(localKeyedValues);

    openThemeMenu(root);
    findThemeOption(root, "Cherry").click();
    expect(readThemeAccent(root)).toBe(`light-dark(${THEME_DEFINITIONS.cherry.lightColors.accent}, ${THEME_DEFINITIONS.cherry.darkColors.accent})`);
    expect(localKeyedValues.get("favorites-search-gallery:preferences")).toMatchObject({ shared: { theme: "cherry" } });
  });

  test("previews a hovered theme without storing it, and restores the picked one when the pointer leaves", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const root = mount(localKeyedValues);

    openThemeMenu(root);
    findThemeOption(root, "Forest").dispatchEvent(new PointerEvent("pointermove"));
    expect(readThemeAccent(root)).toBe(`light-dark(${THEME_DEFINITIONS.forest.lightColors.accent}, ${THEME_DEFINITIONS.forest.darkColors.accent})`);
    expect(localKeyedValues.get("favorites-search-gallery:preferences")).not.toMatchObject({ shared: { theme: "forest" } });
    root.querySelector("[role=\"listbox\"]")!.dispatchEvent(new PointerEvent("pointerleave"));
    expect(readThemeAccent(root)).toBe(`light-dark(${THEME_DEFINITIONS.rule34.lightColors.accent}, ${THEME_DEFINITIONS.rule34.darkColors.accent})`);
  });

  test("applies the theme picked before on mount", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery:preferences", { shared: { theme: "forest" } });
    const app = mount(localKeyedValues).querySelector<HTMLElement>(`.${AppRootClass.root}`)!;

    expect(app.style.getPropertyValue("--fsg-theme-surface"))
      .toBe(`light-dark(${THEME_DEFINITIONS.forest.lightColors.surface}, ${THEME_DEFINITIONS.forest.darkColors.surface})`);
  });

  test("leaves the site's color scheme alone on mount", () => {
    const hostPage = new MemoryHostPage();

    mount(new MemoryLocalKeyedValues(), [], { hostPage });
    expect(hostPage.colorScheme).toBe("light");
  });

  test("hides the native header on mount when it was switched off before", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const hostPage = new MemoryHostPage(true);

    localKeyedValues.set("favorites-search-gallery:preferences", { favorites: { nativeHeaderVisible: false } });
    mount(localKeyedValues, [], { hostPage });
    expect(hostPage.headerVisible).toBe(false);
  });

  test("records the shapes of the active tab's first results after they settle", async() => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const scheduler = new MemoryScheduler();
    const posts = [createPost({ id: "1", width: 300, height: 200 }), createPost({ id: "2", width: 100, height: 400 })];

    mount(localKeyedValues, posts, { scheduler });
    await flushMicrotasks();
    expect(localKeyedValues.get("favorites-search-gallery:state")).not.toHaveProperty(["favorites", "1", "sizes"]);
    scheduler.advance(499);
    expect(localKeyedValues.get("favorites-search-gallery:state")).not.toHaveProperty(["favorites", "1", "sizes"]);
    scheduler.advance(1);
    expect(localKeyedValues.get("favorites-search-gallery:state")).toMatchObject({
      favorites: { 1: { sizes: [{ width: 300, height: 200 }, { width: 100, height: 400 }] } }
    });
  });

  test("keeps the first page's shapes when the active tab moves to another page", async() => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const scheduler = new MemoryScheduler();
    const posts = [createPost({ id: "1", width: 300, height: 200 }), createPost({ id: "2", width: 100, height: 400 })];

    localKeyedValues.set("favorites-search-gallery:preferences", { favorites: { pagination: { pageSize: 1 } } });
    const root = mount(localKeyedValues, posts, { scheduler });

    await flushMicrotasks();
    root.querySelector<HTMLButtonElement>(`.${PageSlotClass.page}[data-page-number="2"]`)!.click();
    expect(root.querySelector(`.${PageSlotClass.page}[aria-current="page"]`)?.textContent).toBe("2");
    scheduler.advance(500);
    expect(localKeyedValues.get("favorites-search-gallery:state")).toMatchObject({
      favorites: { 1: { sizes: [{ width: 300, height: 200 }, { width: 100, height: 400 }] } }
    });
  });

  test("stops watching a tab's tiles once another tab is shown", async() => {
    const watched = new Set<Element>();
    const visibilityObserver: VisibilityObserver = {
      observe: element => {
        watched.add(element);
        return (): void => {
          watched.delete(element);
        };
      }
    };
    const root = mount(new MemoryLocalKeyedValues(), [createPost({ id: "1" })], { visibilityObserver });

    await flushMicrotasks();
    const firstTabTiles = [...root.querySelectorAll(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.root}`)];
    const countWatched = (): number => firstTabTiles.filter(tile => watched.has(tile)).length;
    const before = countWatched();

    root.querySelector<HTMLButtonElement>("button[aria-label='New tab']")!.click();
    expect([before, countWatched()]).toEqual([1, 0]);
  });

  test("enters zen from the search panel's zen button", () => {
    const root = mount();

    root.querySelector<HTMLButtonElement>("button[aria-label=Zen]")!.click();
    expect(root.querySelector(`.${FavoritesAppClass.root}`)!.hasAttribute("data-zen")).toBe(true);
  });

  test("toggles zen on Z in either case", () => {
    const app = mount().querySelector(`.${FavoritesAppClass.root}`)!;
    const zenStates = ["z", "Z"].map(key => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key }));
      return app.hasAttribute("data-zen");
    });

    expect(zenStates).toEqual([true, false]);
  });

  test("exits zen on Escape", () => {
    const root = mount();

    root.querySelector<HTMLButtonElement>("button[aria-label=Zen]")!.click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(root.querySelector(`.${FavoritesAppClass.root}`)!.hasAttribute("data-zen")).toBe(false);
  });

  test("draws the skeleton recorded for the favorites' owner", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery:state", { favorites: { 1: { sizes: [{ width: 4, height: 3 }] } } });
    expect(readAspectRatios(querySkeleton(mount(localKeyedValues)))).toEqual(["4 / 3"]);
  });

  test("draws the default skeleton when only another owner's skeleton is recorded", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery:state", { favorites: { 2: { sizes: [{ width: 4, height: 3 }] } } });
    const ratios = readAspectRatios(querySkeleton(mount(localKeyedValues)));

    expect(ratios).not.toHaveLength(0);
    expect(new Set(ratios)).toEqual(new Set(["1 / 1"]));
  });

  test("reveals the lightbox's last favorite before scrolling to its tile", async() => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const previousScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
    const scrolls: Array<{ target: HTMLElement; shown: Element | null; page: string | null }> = [];

    localKeyedValues.set("favorites-search-gallery:preferences", { favorites: { pagination: { pageSize: 1 } } });
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

    localKeyedValues.set("favorites-search-gallery:preferences", { favorites: { pagination: { pageSize: 1 } } });
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

    localKeyedValues.set("favorites-search-gallery:preferences", { favorites: { pagination: { pageSize: 50, infiniteScroll } } });
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

  test("leaves a tile's click to its post link once the gallery is turned off in the Settings tool", async() => {
    const root = mount(new MemoryLocalKeyedValues(), [createPost({ id: "1" })]);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });

    await flushMicrotasks();
    root.querySelector<HTMLButtonElement>(`.${ActivityBarClass.item}[aria-label="Settings"]`)!.click();
    [...root.querySelectorAll<HTMLButtonElement>(`.${SegmentedClass.option}`)].find(option => option.textContent === "Off")!.click();
    root.querySelector(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)!.dispatchEvent(click);
    expect([click.defaultPrevented, root.querySelector("dialog")!.open]).toEqual([false, false]);
  });

  test("opens the lightbox bare in simple mode", async() => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery:preferences", { favorites: { lightbox: { mode: "simple" } } });
    const root = mount(localKeyedValues, [createPost({ id: "1" })]);

    await flushMicrotasks();
    root.querySelector<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)!.click();
    const dialog = root.querySelector("dialog")!;

    expect([dialog.open, dialog.hasAttribute("data-simple")]).toEqual([true, true]);
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

  test.skip("saves the lightbox favorite's original, named by its id, from the download button", async() => {
    const fileSaver = new MemoryFileSaver();
    const root = mount(new MemoryLocalKeyedValues(), [createPost({ id: "1" })], { fileSaver });

    await flushMicrotasks();
    root.querySelector<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)!.click();
    clickLightboxButton(root, "Download");
    await flushMicrotasks();
    expect(fileSaver.saved.map(saved => saved.name)).toEqual(["1"]);
  });
});
