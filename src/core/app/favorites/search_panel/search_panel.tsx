import { Child, h } from "@/core/ui/h/h";
import { SearchBox, SearchBoxClass } from "@/core/ui/components/search_box/search_box";
import { Emitter } from "@/core/utils/reactive/emitter";
import { EmptyState } from "@/core/ui/components/empty_state/empty_state";
import { FavoritesService } from "@/core/features/favorites/favorites";
import { FavoritesSession } from "@/core/features/favorites/session/session";
import { Paginator } from "@/core/ui/components/paginator/paginator";
import { computed } from "@/core/utils/reactive/signal";
import { createIcon } from "@/core/ui/components/icon/icon";
import { describeFavoritesPanelBody } from "@/core/app/favorites/search_panel/body";

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
  favorites: Pick<FavoritesService, "loadState" | "searchable">;
  session: Pick<FavoritesSession, "query" | "isFiltered" | "results" | "pageNumber" | "pageCount" | "goTo" | "clearFilters" | "submit">;
  focusSearch: Emitter<void>;
  trailing: Child;
  skeleton: Node;
  grid: Node;
}

export function FavoritesSearchPanel({ favorites, session, focusSearch, trailing, skeleton, grid }: FavoritesSearchPanelProps): HTMLElement {
  const panelBody = computed(() => describeFavoritesPanelBody({
    resultCount: session.results.value.length,
    isSearchable: favorites.searchable.reached,
    loadPhase: favorites.loadState.value.phase,
    query: session.query.value,
    isFiltered: session.isFiltered.value
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
            session.clearFilters();
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
            query={session.query}
            trailing={[
              <button className={FavoritesSearchPanelClass.filter} type="button" aria-label="Filters" aria-disabled="true">
                {createIcon("filter", SearchBoxClass.icon)}
              </button>,
              <span className={FavoritesSearchPanelClass.count}>
                {computed(() => describeResultCount(session.results.value.length))}
              </span>
            ]}
            focusRequests={focusSearch}
            onSearch={query => {
              session.submit(query);
              body.scrollTop = 0;
            }}
          />
        </div>
        <Paginator
          pageNumber={session.pageNumber}
          pageCount={session.pageCount}
          onPageChange={pageNumber => {
            session.goTo(pageNumber);
            body.scrollTop = 0;
          }}
        />
        <div className={FavoritesSearchPanelClass.trailing}>{trailing}</div>
      </header>
      {body}
    </section>
  );
}

function describeResultCount(count: number): string {
  return count === 1 ? "1 result" : `${count.toLocaleString()} results`;
}
