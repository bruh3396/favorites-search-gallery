import { ContentDisplayOptions, PaginationState } from "@/types/ui";
import { FavoritesViewCallbacks, LoadProgress } from "@/features/favorites/types/types";
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
import { Layout } from "@/types/app";
import { doNothing } from "@/utils/pure/function";
import { toggleDataset } from "@/utils/browser/dataset";
import { waitForNextPaint } from "@/utils/browser/window";

export interface FavoritesViewConfiguration {
  linksToPostPage: boolean;
}

export interface FavoritesViewDependencies {
  context: AppContext;
  shell: FavoritesShell;
}

export class FavoritesView {
  private readonly context: AppContext;
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

  constructor({ linksToPostPage }: FavoritesViewConfiguration, { context, shell }: FavoritesViewDependencies) {
    const { ports } = context;

    this.context = context;
    this.onContentReplaced = doNothing;
    this.onContentAdded = doNothing;
    this.contentTiler = new ContentTiler(context);
    this.linkSuppressor = new FavoritesLinkSuppressor(id => ports.remotePages.postUrl(id));
    this.skeleton = new FavoritesSkeleton(
      { layout: this.getLayout() },
      { store: ports.localKeyedValues, randomSource: ports.randomSource }
    );
    this.status = new FavoritesStatus(shell.toolbar, shell.toolbarRoot, ports.scheduler);
    this.pagination = new FavoritesPaginationRenderer(shell.toolbar.pagination, shell.toolbar.rangeIndicator);
    this.drawer = new FavoritesDrawer(shell);
    this.elementTemplate = new FavoritesElementTemplate({
      galleryRunning: context.features.has("gallery"),
      linksToPostPage,
      userIsOnTheirOwnFavoritesPage: context.environment.ownsFavorites
    }, {
      postUrl: (id): string => ports.remotePages.postUrl(id),
      resolvePreviewUrl: (media): Promise<string> => ports.remoteMedia.resolvePreviewUrl(media)
    });
    this.thumbPool = this.createThumbPool();
  }

  public setup(callbacks: FavoritesViewCallbacks): void {
    this.onContentReplaced = callbacks.onContentReplaced;
    this.onContentAdded = callbacks.onContentAdded;
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

  public redrawThumb(favorite: Favorite): void {
    this.thumbPool.rebind(favorite);
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

  public setLoadProgress(progress: LoadProgress): void {
    this.status.setLoadProgress(progress);
  }

  public setExpectedTotalFavoriteCount(count: number | null): void {
    this.status.setExpectedTotalFavoriteCount(count);
  }

  public clearStatus(): void {
    this.status.clearStatus();
  }

  public waitForNextPaint(): Promise<void> {
    return waitForNextPaint();
  }

  public async collectAspectRatios(): Promise<void> {
    await this.context.shell.waitForContentThumbsToLoad();
    this.skeleton.collectAspectRatios(this.context.shell.getContentThumbs());
  }

  private createThumbPool(): FavoritesThumbPool<HTMLElement> {
    const configuration = {
      maxRetained: FavoritesConfig.thumbPoolMaxRetained,
      defaultFavorited: this.context.environment.ownsFavorites
    };
    return new FavoritesThumbPool<HTMLElement>(configuration, {
      create: () => this.elementTemplate.createBlankThumb(),
      bind: (root, favorite, favorited) => this.elementTemplate.bindThumb(root, favorite, favorited),
      setAsFavorited: (node, favorited) => this.elementTemplate.setThumbFavorited(node, favorited),
      blankImage: (node) => this.elementTemplate.blankThumbImage(node)
    });
  }
}
