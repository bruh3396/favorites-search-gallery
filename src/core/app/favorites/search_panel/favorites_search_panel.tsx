import { Child, h } from "@/core/ui/h/h";
import { SearchBox, SearchBoxClass } from "@/core/ui/components/search_box/search_box";
import { Emitter } from "@/core/utils/reactive/emitter";
import { EmptyState } from "@/core/ui/components/empty_state/empty_state";
import { FavoritesService } from "@/core/features/favorites/favorites_service";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { Paginator } from "@/core/ui/components/paginator/paginator";
import { computed } from "@/core/utils/reactive/signal";
import { createIcon } from "@/core/ui/components/icon/icon";
import { describeFavoritesSearchPanelBody } from "@/core/app/favorites/search_panel/favorites_search_panel_body_describer";

export const FavoritesSearchPanelClass = {
  root: "fsg-FavoritesSearchPanel",
  header: "fsg-FavoritesSearchPanel-header",
  search: "fsg-FavoritesSearchPanel-search",
  filter: "fsg-FavoritesSearchPanel-filter",
  count: "fsg-FavoritesSearchPanel-count",
  trailing: "fsg-FavoritesSearchPanel-trailing",
  body: "fsg-FavoritesSearchPanel-body"
} as const;

export interface FavoritesSearchPanelProps {
  favoritesService: Pick<FavoritesService, "loadState" | "searchable">;
  favoritesSession: Pick<FavoritesSession, "query" | "isFiltered" | "matchedFavorites" | "pageNumber" | "pageCount" | "goTo" | "clearFilters" | "submit">;
  focusSearch: Emitter<void>;
  trailingChild: Child;
  skeleton: Node;
  grid: Node;
}

export function FavoritesSearchPanel({ favoritesService, favoritesSession, focusSearch, trailingChild, skeleton, grid }: FavoritesSearchPanelProps): HTMLElement {
  const panelBody = computed(() => describeFavoritesSearchPanelBody({
    resultCount: favoritesSession.matchedFavorites.value.length,
    isSearchable: favoritesService.searchable.reached,
    loadPhase: favoritesService.loadState.value.phase,
    query: favoritesSession.query.value,
    isFiltered: favoritesSession.isFiltered.value
  }));
  const body: HTMLElement = (
    <div className={FavoritesSearchPanelClass.body} data-zen-stage="">
      <div hidden={computed(() => panelBody.value.kind !== "skeleton")}>{skeleton}</div>
      <EmptyState
        isShown={computed(() => panelBody.value.kind === "empty")}
        message={computed(() => (panelBody.value.kind === "empty" ? panelBody.value.message : ""))}
        action={computed(() => (panelBody.value.kind === "empty" && panelBody.value.offersClear ? {
          label: "Clear",
          onClick: (): void => {
            favoritesSession.clearFilters();
            focusSearch.emit();
          }
        } : null))}
      />
      {grid}
    </div>
  );
  return (
    <section className={FavoritesSearchPanelClass.root}>
      <header className={FavoritesSearchPanelClass.header}>
        <div className={FavoritesSearchPanelClass.search}>
          <SearchBox
            label="Search favorites"
            query={favoritesSession.query}
            trailingChild={[
              <button className={FavoritesSearchPanelClass.filter} type="button" aria-label="Filters" aria-disabled="true">
                {createIcon("filter", SearchBoxClass.icon)}
              </button>,
              <span className={FavoritesSearchPanelClass.count}>
                {computed(() => describeResultCount(favoritesSession.matchedFavorites.value.length))}
              </span>
            ]}
            focusRequests={focusSearch}
            onSearch={query => {
              favoritesSession.submit(query);
              body.scrollTop = 0;
            }}
          />
        </div>
        <Paginator
          pageNumber={favoritesSession.pageNumber}
          pageCount={favoritesSession.pageCount}
          onPageChange={pageNumber => {
            favoritesSession.goTo(pageNumber);
            body.scrollTop = 0;
          }}
        />
        <div className={FavoritesSearchPanelClass.trailing}>{trailingChild}</div>
      </header>
      {body}
    </section>
  );
}

function describeResultCount(count: number): string {
  return count === 1 ? "1 result" : `${count.toLocaleString()} results`;
}
