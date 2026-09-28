import { ContentDisplayOptions, PaginationState } from "@/types/ui";
import { AppContext } from "@/app/context/context";
import { ContentTiler } from "@/app/layout/content_tiler";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesDrawer } from "@/features/favorites/view/drawer";
import { FavoritesDrawerSectionName } from "@/types/favorites_ui";
import { FavoritesElementTemplate } from "@/features/favorites/view/element_template";
import { FavoritesLinkSuppressor } from "@/features/favorites/view/link_suppressor";
import { FavoritesPaginationRenderer } from "@/features/favorites/view/pagination_renderer";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { FavoritesSkeleton } from "@/features/favorites/view/skeleton/skeleton";
import { FavoritesStatus } from "@/features/favorites/view/status/status";
import { FavoritesThumbPool } from "@/features/favorites/view/thumb_pool";
import { FavoritesViewDependencies } from "@/features/favorites/types/types";
import { Layout } from "@/types/app";
import { doNothing } from "@/utils/pure/function";
import { toggleDataset } from "@/utils/browser/dataset";
import { toggleHeader } from "@/lib/ui/toggles";

export class FavoritesView {
  private readonly contentTiler: ContentTiler;
  private readonly status: FavoritesStatus;
  private readonly pagination: FavoritesPaginationRenderer;
  private readonly drawer: FavoritesDrawer;
  private readonly linkSuppressor: FavoritesLinkSuppressor;
  private readonly skeleton: FavoritesSkeleton;
  private readonly elementTemplate: FavoritesElementTemplate;
  private readonly thumbPool: FavoritesThumbPool<HTMLElement>;
  private onContentReplaced: () => void;
  private onContentAdded: (favorites: Favorite[]) => void;

  constructor(private readonly context: AppContext, shell: FavoritesShell) {
    this.onContentReplaced = doNothing;
    this.onContentAdded = doNothing;
    this.contentTiler = new ContentTiler(context);
    this.linkSuppressor = new FavoritesLinkSuppressor(context.ports.navigation.postUrl);
    this.skeleton = new FavoritesSkeleton(this.getLayout());
    this.status = new FavoritesStatus(shell.toolbar, shell.toolbarRoot);
    this.pagination = new FavoritesPaginationRenderer(shell.toolbar.pagination, shell.toolbar.rangeIndicator);
    this.drawer = new FavoritesDrawer(shell);
    this.elementTemplate = new FavoritesElementTemplate(context.flags.imagusSupportEnabled, context.flags.galleryDisabled, context.environment.device === "mobile", context.environment.ownsFavorites, context.ports.navigation.postUrl);
    this.thumbPool = this.createThumbPool();
    this.pagination.togglePaginator(!context.preferences.favorites.infiniteScroll.value);
    this.drawer.toggle(context.preferences.favorites.drawerOpen.value);
    this.drawer.showSection(context.preferences.favorites.drawerActiveSection.value);
    this.toggleHeader(context.preferences.favorites.headerEnabled.value);
  }

  public toggleHeader(enabled: boolean): void {
    toggleHeader(enabled);
  }

  public setup(dependencies: FavoritesViewDependencies): void {
    this.onContentReplaced = dependencies.onContentReplaced;
    this.onContentAdded = dependencies.onContentAdded;
    this.contentTiler.setup();
  }

  public changeLayout(layout: Layout): void {
    this.contentTiler.changeLayout(layout);
  }

  public getLayout(): Layout {
    return this.contentTiler.getLayout();
  }

  public bottomEdgeElements(): HTMLElement[] {
    return this.contentTiler.bottomEdgeElements();
  }

  public showSearchResults(searchResults: Favorite[], options?: ContentDisplayOptions): void {
    this.contentTiler.tile(this.thumbPool.resolve(searchResults), options);
    window.scrollTo(0, FavoritesConfig.contentTopOffset[this.context.environment.device]);
    this.onContentReplaced();
  }

  public addToBottom(favorites: Favorite[]): void {
    this.contentTiler.addToBottom(this.thumbPool.resolveAppended(favorites));
    this.onContentAdded(favorites);
  }

  public setFavorited(id: string, favorited: boolean): void {
    this.thumbPool.setFavorited(id, favorited);
  }

  public toggleSearchInputs(value: boolean): boolean {
    return toggleDataset(document.documentElement, "loading", !value);
  }

  public showSkeleton(): void {
    this.skeleton.show((elements) => this.contentTiler.tile(elements));
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

  public toggleGotoPagePopover(): void {
    this.pagination.toggleGotoPagePopover();
  }

  public closeGotoPagePopover(): void {
    this.pagination.closeGotoPagePopover();
  }

  public renderPagination(state: PaginationState): void {
    this.pagination.render(state);
  }

  public updatePaginator(state: PaginationState): void {
    this.pagination.updatePaginator(state);
  }

  public toggleDrawer(open: boolean): void {
    this.drawer.toggle(open);
  }

  public showDrawerSection(section: FavoritesDrawerSectionName): void {
    this.drawer.showSection(section);
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

private createThumbPool(): FavoritesThumbPool<HTMLElement> {
  return new FavoritesThumbPool<HTMLElement>({
    create: () => this.elementTemplate.createBlankThumb(),
    bind: (root, favorite, favorited) => this.elementTemplate.bindThumb(root, favorite, favorited),
    setAsFavorited: (node, favorited) => this.elementTemplate.setThumbFavorited(node, favorited),
    blankImage: () => this.elementTemplate.blankThumbImage
  }, FavoritesConfig.thumbPoolMaxRetained, this.context.environment.ownsFavorites);
}
}
