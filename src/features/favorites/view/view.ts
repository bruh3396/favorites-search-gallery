import * as FavoritesChangelog from "@/features/favorites/view/shell/changelog";
import * as FavoritesHelp from "@/features/favorites/view/shell/help";
import * as FavoritesNativePageCleaner from "@/features/favorites/view/native_page_cleaner";
import { ContentDisplayOptions, PaginationState } from "@/types/ui";
import { FavoritesToolbarSlots, FavoritesViewDependencies } from "@/features/favorites/types/types";
import { AppContext } from "@/app/context/context";
import { ContentTiler } from "@/app/layout/content_tiler";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { Favorite } from "@/types/favorite";
import { FavoritesDrawer } from "@/features/favorites/view/shell/drawer";
import { FavoritesLinkSuppressor } from "@/features/favorites/view/link_suppression";
import { FavoritesPaginationRenderer } from "@/features/favorites/view/pagination_renderer";
import { FavoritesShell } from "@/features/favorites/view/shell/shell";
import { FavoritesSkeleton } from "@/features/favorites/view/skeleton/skeleton";
import { FavoritesStatus } from "@/features/favorites/view/status/status";
import { Layout } from "@/types/app";
import { doNothing } from "@/utils/pure/function";
import { markAsNew } from "@/features/favorites/view/badge";
import { toggleDataset } from "@/utils/browser/dataset";

export class FavoritesView {
  public readonly markAsNew = markAsNew;
  public readonly removeOriginalUnusedScripts = FavoritesNativePageCleaner.removeOriginalUnusedScripts;
  public readonly takeNativeFavorites = FavoritesNativePageCleaner.takeNativeFavorites;
  private readonly contentTiler: ContentTiler;
  private readonly shell: FavoritesShell;
  private readonly status: FavoritesStatus;
  private readonly pagination: FavoritesPaginationRenderer;
  private readonly drawer: FavoritesDrawer;
  private readonly linkSuppressor: FavoritesLinkSuppressor;
  private readonly skeleton: FavoritesSkeleton;
  private onContentReplaced: () => void = doNothing;
  private onContentAdded: (favorites: Favorite[]) => void = doNothing;

  constructor(private readonly context: AppContext) {
    this.contentTiler = new ContentTiler(context);
    this.linkSuppressor = new FavoritesLinkSuppressor();
    this.skeleton = new FavoritesSkeleton(this.getLayout());
    this.shell = new FavoritesShell(context.shell, context.environment);
    this.status = new FavoritesStatus();
    this.pagination = new FavoritesPaginationRenderer(context.preferences);
    this.drawer = new FavoritesDrawer(context.preferences, this.shell);
  }

  public setup(dependencies: FavoritesViewDependencies): void {
    this.onContentReplaced = dependencies.onContentReplaced;
    this.onContentAdded = dependencies.onContentAdded;
    this.shell.setup();
    const slots = this.shell.getToolbarSlots();

    this.status.setup(slots, this.shell.getToolbar());
    this.contentTiler.setup();
    this.pagination.setup(dependencies.onPageSelected, dependencies.onPageStepped, slots.paginationSlot, slots.resultsCount);
    this.drawer.setup({
      change: FavoritesChangelog.buildDrawerView(),
      help: FavoritesHelp.buildDrawerView(this.context.environment, dependencies.onShowControls),
      ...dependencies.drawerViews
    }, dependencies.onDrawerOpen, dependencies.onDrawerViewSelected);
  }

  public changeLayout(layout: Layout): void {
    this.contentTiler.changeLayout(layout);
  }

  public getLayout(): Layout {
    return this.contentTiler.getLayout();
  }

  public getToolbarSlots(): FavoritesToolbarSlots {
    return this.shell.getToolbarSlots();
  }

  public getToolbar(): HTMLElement | null {
    return this.shell.getToolbar();
  }

  public bottomEdgeElements(): HTMLElement[] {
    return this.contentTiler.bottomEdgeElements();
  }

  public showSearchResults(searchResults: Favorite[], options: ContentDisplayOptions = { fade: true }): void {
    this.contentTiler.tile(searchResults.map((result) => result.root), options);
    window.scrollTo(0, this.context.environment.onMobileDevice ? 10 : 0);
    this.onContentReplaced();
  }

  public addToTop(favorites: Favorite[]): void {
    this.contentTiler.addToTop(favorites.map((favorite) => favorite.root));
    this.onContentAdded(favorites);
  }

  public addToBottom(favorites: Favorite[]): void {
    this.contentTiler.addToBottom(favorites.map((favorite) => favorite.root));
    this.onContentAdded(favorites);
  }

  public toggleSearchInputs(value: boolean): boolean {
    return toggleDataset(document.documentElement, "loading", !value);
  }

  public showSkeleton(): void {
    this.contentTiler.tile(this.skeleton.elements);
  }

  public suppressLinkOnHoveredThumb(event: EnhancedMouseEvent): void {
    this.linkSuppressor.suppressLinkOnHoveredThumb(event);
  }

  public togglePaginator(value: boolean): void {
    this.pagination.togglePaginator(value);
  }

  public isGotoPagePopoverTarget(target: Node): boolean {
    return this.pagination.isGotoPagePopoverTarget(target);
  }

  public closeGotoPagePopover(): void {
    this.pagination.closeGotoPagePopover();
  }

  public buildPaginator(state: PaginationState): void {
    this.pagination.buildPaginator(state);
  }

  public updatePaginator(state: PaginationState): void {
    this.pagination.updatePaginator(state);
  }

  public toggleDrawer(open: boolean): void {
    this.drawer.toggle(open);
  }

  public setStatus(text: string): void {
    this.status.setStatus(text);
  }

  public setTemporaryStatus(text: string): void {
    this.status.setTemporaryStatus(text);
  }

  public setMatchCount(value: number): void {
    this.status.setResultsCount(value);
  }

  public updateFetchStatus(completed: number, resultsCount: number): void {
    this.status.updateFetchStatus(completed, resultsCount);
  }

  public setLoadProgress(loaded: number, total: number): void {
    this.status.setLoadProgress(loaded, total);
  }

  public setExpectedTotalFavoritesCount(count: number | null): void {
    this.status.setExpectedTotalFavoritesCount(count);
  }

  public clearStatus(): void {
    this.status.clearStatus();
  }

  public async collectAspectRatios(): Promise<void> {
    await this.context.shell.waitForContentThumbsToLoad();
    this.skeleton.collectAspectRatios(this.context.shell.getContentThumbs());
  }
}
