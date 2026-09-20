import { describe, expect, test, vi } from "vitest";
import { Events } from "@/app/context/events";
import { Favorite } from "@/types/favorite";
import { FavoritesModel } from "@/features/favorites/model/model";
import { FavoritesPaginatedDisplay } from "@/features/favorites/flows/display/paginated_display";
import { FavoritesView } from "@/features/favorites/view/view";
import { NavigationKey } from "@/types/input";
import { PaginationState } from "@/types/ui";
import { Shell } from "@/app/context/shell";

const EMPTY_PAGINATION: PaginationState = {
  totalCount: 0, sliceStart: 0, sliceEnd: 0, currentPage: 1, finalPage: 1, sequence: [1]
};

function makeFavorite(id: string): Favorite {
  return { id, thumbUrl: `https://example/${id}.jpg` } as Partial<Favorite> as Favorite;
}

interface ModelOverrides {
  currentPage?: Favorite[];
  hasOnlyOnePage?: boolean;
  selectAdjacentPage?: (d: NavigationKey) => boolean;
  selectWrappedAdjacentPage?: (d: NavigationKey) => boolean;
}

function makeModel(overrides: ModelOverrides = {}): FavoritesModel {
  return {
    currentPageFavorites: () => overrides.currentPage ?? [],
    adjacentPageFavorites: () => [],
    atFinalPage: () => true,
    hasOnlyOnePage: () => overrides.hasOnlyOnePage ?? false,
    getCurrentSearchResults: () => [],
    paginate: vi.fn(),
    selectPage: vi.fn(),
    selectAdjacentPage: overrides.selectAdjacentPage ?? ((): boolean => false),
    selectWrappedAdjacentPage: overrides.selectWrappedAdjacentPage ?? ((): boolean => false),
    paginationContext: () => EMPTY_PAGINATION
  } as Partial<FavoritesModel> as FavoritesModel;
}

interface ViewSpies {
  togglePaginator: ReturnType<typeof vi.fn>;
  updatePaginator: ReturnType<typeof vi.fn>;
  showSearchResults: ReturnType<typeof vi.fn>;
  buildPaginator: ReturnType<typeof vi.fn>;
  addToBottom: ReturnType<typeof vi.fn>;
}

function makeView(): { view: FavoritesView; spies: ViewSpies } {
  const spies: ViewSpies = {
    togglePaginator: vi.fn(),
    updatePaginator: vi.fn(),
    showSearchResults: vi.fn(),
    buildPaginator: vi.fn(),
    addToBottom: vi.fn()
  };
  return { view: { ...spies } as Partial<FavoritesView> as FavoritesView, spies };
}

function makeShell(renderedIds: string[] = []): Shell {
  const rendered = new Set(renderedIds);
  return {
    hasThumb: (id: string) => rendered.has(id),
    waitForContentThumbsToLoad: () => Promise.resolve([])
  } as Partial<Shell> as Shell;
}

function makeEvents(favoritesLoaded: boolean): Events {
  return { favorites: { favoritesLoaded: { fired: favoritesLoaded } } } as Partial<Events> as Events;
}

function build(model: FavoritesModel, view: FavoritesView, shell = makeShell(), loaded = false): FavoritesPaginatedDisplay {
  return new FavoritesPaginatedDisplay(model, view, makeEvents(loaded), shell);
}

describe("FavoritesPaginatedDisplay.sync", () => {
  test("appends favorites whose thumbs are not rendered", () => {
    const favorites = [makeFavorite("18751703"), makeFavorite("42"), makeFavorite("999")];
    const { view, spies } = makeView();

    build(makeModel({ currentPage: favorites }), view, makeShell(["18751703"])).sync();

    expect(spies.addToBottom).toHaveBeenCalledTimes(1);
    expect(spies.addToBottom.mock.calls[0][0].map((f: Favorite) => f.id)).toEqual(["42", "999"]);
  });

  test("does not append when every thumb is already rendered", () => {
    const favorites = [makeFavorite("42"), makeFavorite("999")];
    const { view, spies } = makeView();

    build(makeModel({ currentPage: favorites }), view, makeShell(["42", "999"])).sync();

    expect(spies.addToBottom).not.toHaveBeenCalled();
  });

  test("numeric ids do not throw", () => {
    const { view } = makeView();

    expect(() => build(makeModel({ currentPage: [makeFavorite("18751703")] }), view).sync()).not.toThrow();
  });
});

describe("FavoritesPaginatedDisplay.advance", () => {
  test("before load: renders and returns true when an adjacent page exists", () => {
    const model = makeModel({ selectAdjacentPage: () => true });
    const { view, spies } = makeView();
    const wasAdvanced = build(model, view, makeShell(), false).advance("ArrowRight");

    expect(wasAdvanced).toBe(true);
    expect(spies.showSearchResults).toHaveBeenCalledTimes(1);
  });

  test("before load: returns false and does not render when no adjacent page", () => {
    const model = makeModel({ selectAdjacentPage: () => false });
    const { view, spies } = makeView();
    const wasAdvanced = build(model, view, makeShell(), false).advance("ArrowRight");

    expect(wasAdvanced).toBe(false);
    expect(spies.showSearchResults).not.toHaveBeenCalled();
  });

  test("after load: renders and returns true when a wrapped adjacent page exists", () => {
    const model = makeModel({ selectWrappedAdjacentPage: () => true });
    const { view, spies } = makeView();
    const wasAdvanced = build(model, view, makeShell(), true).advance("ArrowLeft");

    expect(wasAdvanced).toBe(true);
    expect(spies.showSearchResults).toHaveBeenCalledTimes(1);
  });

  test("after load: when no wrapped page, returns whether there is only one page", () => {
    const model = makeModel({ selectWrappedAdjacentPage: () => false, hasOnlyOnePage: true });
    const { view, spies } = makeView();
    const wasAdvanced = build(model, view, makeShell(), true).advance("ArrowLeft");

    expect(wasAdvanced).toBe(true);
    expect(spies.showSearchResults).not.toHaveBeenCalled();
  });
});
