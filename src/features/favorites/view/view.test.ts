import { afterEach, describe, expect, test, vi } from "vitest";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { Environment } from "@/core/boundary/environment";
import { Favorite } from "@/types/favorite";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { FavoritesView } from "@/features/favorites/view/view";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { PaginationState } from "@/types/ui";
import { PreferenceOverrides } from "@/testing/preferences";
import { Shell } from "@/app/context/shell";
import { createAppContext } from "@/testing/context";
import { createEnvironment } from "@/testing/environment";

interface Setup {
  view: FavoritesView;
  shell: FavoritesShell;
  content: HTMLElement;
  scheduler: MemoryScheduler;
  replaced: ReturnType<typeof vi.fn<() => void>>;
  added: ReturnType<typeof vi.fn<(favorites: Favorite[]) => void>>;
}

interface SetupOptions {
  preferences?: PreferenceOverrides;
  environment?: Partial<Environment>;
  localKeyedValues?: MemoryLocalKeyedValues;
  linksToPostPage?: boolean;
}

function setup({ preferences = {}, environment: environmentOverrides = {}, localKeyedValues = new MemoryLocalKeyedValues(), linksToPostPage = false }: SetupOptions = {}): Setup {
  const environment = createEnvironment(environmentOverrides);
  const appShell = new Shell();
  const shell = new FavoritesShell(environment, appShell);
  const scheduler = new MemoryScheduler();
  const context = createAppContext({ environment: environmentOverrides, preferences: { ...preferences, favorites: { layout: "grid", ...preferences.favorites } }, shell: appShell, ports: { localKeyedValues, scheduler } });
  const view = new FavoritesView({ linksToPostPage }, { context, shell });
  const replaced = vi.fn<() => void>();
  const added = vi.fn<(favorites: Favorite[]) => void>();

  view.setup({ onContentReplaced: replaced, onContentAdded: added });
  document.body.append(appShell.root);
  return { view, shell, content: appShell.content, scheduler, replaced, added };
}

function createFavorite(id: string, width = 100, height = 200): Favorite {
  return { id, media: { kind: "image", locator: "" }, isNew: false, post: { width, height } } as unknown as Favorite;
}

function createFavorites(...ids: string[]): Favorite[] {
  return ids.map(id => createFavorite(id));
}

function createState(overrides: Partial<PaginationState> = {}): PaginationState {
  return { currentPage: 1, finalPage: 3, totalCount: 300, sliceStart: 0, sliceEnd: 100, sequence: [1, 2, 3], ...overrides };
}

function idsOf(content: HTMLElement): string[] {
  return Array.from(content.querySelectorAll<HTMLElement>(".post")).map(thumb => thumb.id);
}

function isFavoritedOf(content: HTMLElement, id: string): boolean {
  return content.querySelector<HTMLElement>(`[id="${id}"] [data-is-favorite]`) !== null;
}

function pagesOf(shell: FavoritesShell): string[] {
  return Array.from(shell.toolbar.pagination.querySelectorAll("button[data-action=page]")).map(button => button.textContent ?? "");
}

function isPopoverOpen(shell: FavoritesShell): boolean {
  return shell.toolbar.pagination.querySelector<HTMLElement>(`#${FavoritesId.gotoPagePopover}`)?.dataset.open !== undefined;
}

function hover(view: FavoritesView, target: Element): void {
  target.addEventListener("mouseover", (event) => view.suppressLinkOnHoveredThumb(new EnhancedMouseEvent(event as MouseEvent)), { once: true });
  target.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
}

describe("FavoritesView", () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.documentElement.removeAttribute("data-pagination-hidden");
    document.documentElement.removeAttribute("data-loading");
  });

  describe("content", () => {
    test("shows search results in place of what was there", () => {
      const { view, content, replaced } = setup();

      view.showSearchResults(createFavorites("1", "2"));
      view.showSearchResults(createFavorites("3"), { fade: false });
      expect(idsOf(content)).toEqual(["3"]);
      expect(replaced).toHaveBeenCalledTimes(2);
    });

    test("adds favorites to the bottom", () => {
      const { view, content, added } = setup();
      const favorites = createFavorites("2");

      view.showSearchResults(createFavorites("1"));
      view.addToBottom(favorites);
      expect(idsOf(content)).toEqual(["1", "2"]);
      expect(added).toHaveBeenCalledWith(favorites);
    });

    test("marks a shown thumb as favorited or not", () => {
      const { view, content } = setup({ environment: { ownsFavorites: false } });

      view.showSearchResults(createFavorites("1"));
      view.setFavorited("1", true);
      expect(isFavoritedOf(content, "1")).toBe(true);
      view.setFavorited("1", false);
      expect(isFavoritedOf(content, "1")).toBe(false);
    });

    test("changes layout", () => {
      const { view } = setup();

      view.changeLayout("row");
      expect(view.getLayout()).toBe("row");
    });

    test("reports the last thumb of each column", () => {
      const { view } = setup({ preferences: { favorites: { layout: "column", columnCount: 2 } } });

      view.showSearchResults(createFavorites("1", "2", "3", "4"), { fade: false });
      expect(view.bottomEdgeElements().map(element => element.id).sort()).toEqual(["3", "4"]);
    });

    test("toggles the search inputs", () => {
      const { view } = setup();

      expect(view.toggleSearchInputs(false)).toBe(true);
      expect(view.toggleSearchInputs(true)).toBe(false);
    });

    test("strips the link from the hovered thumb", () => {
      const { view, content } = setup({ linksToPostPage: true });

      view.showSearchResults(createFavorites("1"));
      const link = content.querySelector("a") as HTMLAnchorElement;

      expect(link.getAttribute("href")).toBe(new MemoryRemotePages().postUrl("1"));
      hover(view, content.querySelector("img") as HTMLElement);
      expect(link.getAttribute("href")).toBeNull();
    });
  });

  describe("skeleton", () => {
    test("fills the content with placeholders", () => {
      const { view, content } = setup();

      view.showSkeleton();
      expect(content.querySelectorAll(".skeleton-item").length).toBeGreaterThan(0);
    });

    test("shapes the next visit's placeholders after the thumbs that loaded", async() => {
      const localKeyedValues = new MemoryLocalKeyedValues();
      const { view, content } = setup({ preferences: { favorites: { layout: "native" } }, localKeyedValues });

      view.showSearchResults([createFavorite("1", 120, 240)]);
      content.querySelectorAll("img").forEach(image => Object.defineProperty(image, "naturalWidth", { value: 120 }));
      content.querySelectorAll("img").forEach(image => Object.defineProperty(image, "naturalHeight", { value: 240 }));
      const collecting = view.collectAspectRatios();

      content.querySelectorAll("img").forEach(image => image.dispatchEvent(new Event("load")));
      await collecting;
      document.body.replaceChildren();
      const next = setup({ preferences: { favorites: { layout: "native" } }, localKeyedValues });

      next.view.showSkeleton();
      const first = next.content.querySelector<HTMLElement>(".skeleton-item");

      expect([first?.style.width, first?.style.height]).toEqual(["120px", "240px"]);
    });
  });

  describe("pagination", () => {
    test("draws and updates the paginator", () => {
      const { view, shell } = setup();

      view.renderPagination(createState());
      view.updatePaginator(createState({ finalPage: 4, sequence: [1, 2, 3, 4] }));
      expect(pagesOf(shell)).toEqual(["1", "2", "3", "4"]);
    });

    test("hides and shows the paginator", () => {
      const { view } = setup();

      view.togglePaginator(false);
      expect(document.documentElement.dataset.paginationHidden).toBeDefined();
      view.togglePaginator(true);
      expect(document.documentElement.dataset.paginationHidden).toBeUndefined();
    });

    test("opens and closes the go-to-page prompt", () => {
      const { view, shell } = setup();
      const field = shell.toolbar.pagination.querySelector("input") as HTMLInputElement;

      view.toggleGotoPagePopover();
      expect(isPopoverOpen(shell)).toBe(true);
      expect(view.isGotoPagePopoverTarget(field)).toBe(true);
      view.closeGotoPagePopover();
      expect(isPopoverOpen(shell)).toBe(false);
    });
  });

  describe("drawer", () => {
    test("opens and shows a section", () => {
      const { view, shell } = setup();

      view.toggleDrawer(true);
      view.showDrawerSection("snippets");
      expect(shell.root.dataset.drawerOpen).toBeDefined();
      expect(shell.drawer.snippets.root.dataset.hidden).toBeUndefined();
    });
  });

  describe("status", () => {
    test("shows and clears a status", () => {
      const { view, shell } = setup();

      view.setStatus("Peeling apples");
      expect(shell.toolbar.loadStatus.textContent).toBe("Peeling apples");
      view.clearStatus();
      expect(shell.toolbar.loadStatus.textContent).toBe("");
    });

    test("a temporary status clears itself", () => {
      const { view, shell, scheduler } = setup();

      view.setTemporaryStatus("Apple added");
      expect(shell.toolbar.loadStatus.textContent).toBe("Apple added");
      scheduler.advance(1_000);
      expect(shell.toolbar.loadStatus.textContent).toBe("");
    });

    test("counts matches", () => {
      const { view, shell } = setup();

      view.setMatchCount(2);
      expect(shell.toolbar.resultsCount.textContent).toBe("2 Results");
    });

    test("reports fetching against the expected total", () => {
      const { view, shell } = setup();

      view.setExpectedTotalFavoriteCount(500);
      view.updateFetchStatus(100, 3);
      expect(shell.toolbar.loadStatus.textContent).toBe("Fetching - 100 / 500");
    });

    test("reports loading progress", () => {
      const { view, shell } = setup();

      view.setLoadProgress(25, 100);
      expect(shell.toolbar.loadStatus.textContent).toBe("Loading favorites - 25 / 100");
    });
  });
});
