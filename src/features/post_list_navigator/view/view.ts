import { markAsFavorite, markAsFavoriteById, setFavoriteIndicatorLoading, unmarkAsFavorite } from "@/features/post_list_navigator/dom_tweaks/favorite_indicator";
import { AppContext } from "@/app/context/context";
import { ContentTiler } from "@/app/layout/content_tiler";
import { ITEM_SELECTOR } from "@/lib/ui/thumb/selectors";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { preparePostListThumbs } from "@/features/post_list_navigator/dom_tweaks/thumb_preparer";
import { render } from "@/features/post_list_navigator/view/renderer";
import { setInfiniteScrollStyle } from "@/features/post_list_navigator/dom_tweaks/infinite_scroll_style";

export class PostListNavigatorView {
  private readonly contentTiler: ContentTiler;

  constructor(private readonly context: AppContext) {
    this.contentTiler = new ContentTiler(context);
    this.contentTiler.setup();
  }

  public renderPostList(postList: PostList): void {
    render(this.contentTiler, postList);
  }

  public insertNewSearchResults(items: HTMLElement[]): void {
    this.contentTiler.addToBottom(items);
  }

  public tileNativePostListThumbs(): void {
    this.contentTiler.tile(this.context.shell.getPageThumbs());
  }

  public removeNativeImageList(): void {
    document.querySelector(".image-list")?.replaceChildren();
  }

  public prepareNativePostListThumbs(): HTMLElement[] {
    return preparePostListThumbs(Array.from(document.querySelectorAll(ITEM_SELECTOR)), this.context.environment.onMobileDevice, this.context.flags.galleryDisabled);
  }

  public currentSearch(): string {
    return (document.querySelector("input[name=\"tags\"]") as HTMLInputElement)?.value ?? "";
  }

  public changeLayout(layout: Parameters<ContentTiler["changeLayout"]>[0]): void {
    this.contentTiler.changeLayout(layout);
  }

  public getLayout(): ReturnType<ContentTiler["getLayout"]> {
    return this.contentTiler.getLayout();
  }

  public setInfiniteScrollStyle(enabled: boolean): void {
    setInfiniteScrollStyle(enabled);
  }

  public setFavoriteIndicatorLoading(loading: boolean): void {
    setFavoriteIndicatorLoading(loading);
  }

  public markAsFavorite(thumb: HTMLElement): void {
    markAsFavorite(thumb);
  }

  public markAsFavoriteById(id: string): void {
    markAsFavoriteById(id);
  }

  public unmarkAsFavorite(thumb: HTMLElement): void {
    unmarkAsFavorite(thumb);
  }

  public markAsFavorites(thumbs: HTMLElement[]): void {
    thumbs.forEach(thumb => markAsFavorite(thumb));
  }

  public unmarkAsFavorites(thumbs: HTMLElement[]): void {
    thumbs.forEach(thumb => unmarkAsFavorite(thumb));
  }
}
