import { PostList } from "@/features/post_list_navigator/types/post_list_page";

type PostListEntry =
  | { status: "loading"; loaded: Promise<void> }
  | { status: "loaded"; page: PostList };

export class PostListNavigatorPageCache {
  private readonly pages: Map<number, PostListEntry> = new Map();

  public isLoaded(pageNumber: number): boolean {
    return this.pages.get(pageNumber)?.status === "loaded";
  }

  public get(pageNumber: number): PostList | undefined {
    const entry = this.pages.get(pageNumber);
    return entry?.status === "loaded" ? entry.page : undefined;
  }

  public pendingLoad(pageNumber: number): Promise<void> | undefined {
    const entry = this.pages.get(pageNumber);
    return entry?.status === "loading" ? entry.loaded : undefined;
  }

  public allThumbs(): HTMLElement[] {
    return Array.from(this.pages.keys())
      .sort((a, b) => a - b)
      .flatMap(n => this.get(n)?.thumbs ?? []);
  }

  public remove(pageNumber: number): void {
    this.pages.delete(pageNumber);
  }

  public markLoading(pageNumber: number, loaded: Promise<void>): void {
    this.pages.set(pageNumber, { status: "loading", loaded });
  }

  public markLoaded(pageNumber: number, page: PostList): void {
    this.pages.set(pageNumber, { status: "loaded", page });
  }
}
