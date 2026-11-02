import { Child, h } from "@/core/ui/h/h";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { Emitter } from "@/core/utils/reactive/emitter";
import { EmptyState } from "@/core/ui/components/empty_state/empty_state";
import { FavoritesService } from "@/core/features/favorites/favorites_service";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { Paginator } from "@/core/ui/components/paginator/paginator";
import { SearchBox } from "@/core/ui/components/search_box/search_box";
import { describeFavoritesSearchPanelBody } from "@/core/app/favorites/search_panel/favorites_search_panel_body_describer";

export const FavoritesSearchPanelClass = {
  root: "fsg-FavoritesSearchPanel",
  header: "fsg-FavoritesSearchPanel-header",
  search: "fsg-FavoritesSearchPanel-search",
  filter: "fsg-FavoritesSearchPanel-filter",
  count: "fsg-FavoritesSearchPanel-count",
  paginator: "fsg-FavoritesSearchPanel-paginator",
  trailing: "fsg-FavoritesSearchPanel-trailing",
  body: "fsg-FavoritesSearchPanel-body"
} as const;

export interface FavoritesSearchPanelProps {
  favoritesService: Pick<FavoritesService, "loadState" | "searchable">;
  favoritesSession: Pick<FavoritesSession, "query" | "isFiltered" | "matchedFavorites" | "pageNumber" | "pageCount" | "goTo" | "clearFilters">;
  submittedQueries: Readable<readonly string[]>;
  submit: (query: string) => void;
  focusSearch: Emitter<void>;
  trailingChild: Child;
  skeleton: Node;
  grid: Node;
  searchElsewhere: (query: string) => void;
}

export function FavoritesSearchPanel({
  favoritesService, favoritesSession, submittedQueries, submit, focusSearch, trailingChild, skeleton, grid, searchElsewhere
}: FavoritesSearchPanelProps): HTMLElement {
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
      <div hidden={computed(() => panelBody.value.kind !== "empty")}>
        <EmptyState
          message={computed(() => (panelBody.value.kind === "empty" ? panelBody.value.message : ""))}
          action={computed(() => (panelBody.value.kind === "empty" && panelBody.value.offersClear ? {
            label: "Clear",
            onClick: (): void => {
              favoritesSession.clearFilters();
              focusSearch.emit();
            }
          } : null))}
        />
      </div>
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
            submittedQueries={submittedQueries}
            trailingChild={[
              <IconButton className={FavoritesSearchPanelClass.filter} icon="filter" label="Filters" disabled={true} />,
              <span className={FavoritesSearchPanelClass.count}>
                {computed(() => describeResultCount(favoritesSession.matchedFavorites.value.length))}
              </span>
            ]}
            focusRequests={focusSearch}
            onSearch={query => {
              submit(query);
              body.scrollTop = 0;
            }}
            searchElsewhere={searchElsewhere}
          />
        </div>
        <div className={FavoritesSearchPanelClass.paginator} hidden={computed(() => favoritesSession.pageCount.value <= 1)}>
          <Paginator
            pageNumber={favoritesSession.pageNumber}
            pageCount={favoritesSession.pageCount}
            onPageChange={pageNumber => {
              favoritesSession.goTo(pageNumber);
              body.scrollTop = 0;
            }}
          />
        </div>
        <div className={FavoritesSearchPanelClass.trailing}>{trailingChild}</div>
      </header>
      {body}
    </section>
  );
}

function describeResultCount(count: number): string {
  return count === 1 ? "1 result" : `${count.toLocaleString()} results`;
}
