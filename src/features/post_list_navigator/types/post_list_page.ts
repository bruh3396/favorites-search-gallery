import { POSTS_PER_POST_LIST_PAGE } from "@/adapters/rule34/client/post_list_page";
import { Post } from "@/core/domain/post/post";

export class PostList {
  public thumbs: HTMLElement[];
  public posts: Post[];
  public paginator: HTMLElement | null;
  public ids: Set<string>;
  public pageIndex: number;

  constructor(pageIndex: number, thumbs: HTMLElement[], posts: Post[], paginator: HTMLElement | null) {
    this.thumbs = thumbs;
    this.posts = posts;
    this.paginator = paginator;
    this.pageIndex = pageIndex;
    this.ids = new Set(this.thumbs.map(thumb => thumb.id));
  }

  public get isEmpty(): boolean {
    return this.thumbs.length === 0;
  }

  public get isFirst(): boolean {
    return this.pageIndex === 0;
  }

  public get isLast(): boolean {
    return this.thumbs.length < POSTS_PER_POST_LIST_PAGE;
  }
}
