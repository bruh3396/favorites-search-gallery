import * as PostListNavigatorFavoriteIndicator from "@/features/post_list_navigator/view/favorite_indicator";
import * as PostListNavigatorInfiniteScrollStyle from "@/features/post_list_navigator/view/infinite_scroll_style";
import * as PostListNavigatorPage from "@/features/post_list_navigator/view/page";
import * as PostListNavigatorRenderer from "@/features/post_list_navigator/view/renderer";
import { AppContext } from "@/app/context/context";
import { ContentTiler } from "@/app/layout/content_tiler";
import { ITEM_SELECTOR } from "@/lib/ui/thumb/selectors";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { preparePostListThumbs } from "@/lib/ui/thumb/post_list_element";

export class PostListNavigatorView {
  private readonly contentTiler: ContentTiler;

  constructor(private readonly context: AppContext) {
    this.contentTiler = new ContentTiler(context);
    this.contentTiler.setup();
  }

  public renderPostList(postList: PostList): void {
    PostListNavigatorRenderer.render(this.contentTiler, postList);
  }

  public insertNewSearchResults(items: HTMLElement[]): void {
    this.contentTiler.addToBottom(items);
  }

  public tileNativePostListThumbs(): void {
    this.contentTiler.tile(this.context.shell.getPageThumbs());
  }

  public removeNativeImageList(): void {
    PostListNavigatorPage.removeNativeImageList();
  }

  public prepareNativePostListThumbs(): HTMLElement[] {
    return preparePostListThumbs(Array.from(document.querySelectorAll(ITEM_SELECTOR)), this.context.environment.onMobileDevice, this.context.flags.galleryDisabled);
  }

  public currentSearch(): string {
    return PostListNavigatorPage.currentSearch();
  }

  public lastItems(): HTMLElement[] {
    return PostListNavigatorPage.lastItems();
  }

  public changeLayout(layout: Parameters<ContentTiler["changeLayout"]>[0]): void {
    this.contentTiler.changeLayout(layout);
  }

  public getLayout(): ReturnType<ContentTiler["getLayout"]> {
    return this.contentTiler.getLayout();
  }

  public setInfiniteScrollStyle(enabled: boolean): void {
    PostListNavigatorInfiniteScrollStyle.setInfiniteScrollStyle(enabled);
  }

  public setFavoriteIndicatorLoading(loading: boolean): void {
    PostListNavigatorFavoriteIndicator.setFavoriteIndicatorLoading(loading);
  }

  public markAsFavorite(thumb: HTMLElement): void {
    PostListNavigatorFavoriteIndicator.markAsFavorite(thumb);
  }

  public markAsFavoriteById(id: string): void {
    PostListNavigatorFavoriteIndicator.markAsFavoriteById(id, this.context.shell);
  }

  public unmarkAsFavorite(thumb: HTMLElement): void {
    PostListNavigatorFavoriteIndicator.unmarkAsFavorite(thumb);
  }

  public markAsFavorites(thumbs: HTMLElement[]): void {
    thumbs.forEach(thumb => PostListNavigatorFavoriteIndicator.markAsFavorite(thumb));
  }

  public unmarkAsFavorites(thumbs: HTMLElement[]): void {
    thumbs.forEach(thumb => PostListNavigatorFavoriteIndicator.unmarkAsFavorite(thumb));
  }
}
