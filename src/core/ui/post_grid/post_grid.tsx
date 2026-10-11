import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { GridLayout, applyTiling, arrangeTiles } from "@/core/ui/post_grid/tiler";
import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { KeyedList } from "@/core/ui/post_grid/keyed_list";
import { Media } from "@/core/domain/media/media";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { Tile } from "@/core/ui/post_grid/tile";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export const PostGridClass = {
  root: "fsg-PostGrid"
} as const;

export interface PostGridSettings {
  readonly layout: Readable<GridLayout>;
  readonly size: Readable<number>;
  readonly upscale: Readable<boolean>;
}

export interface PostGridProps<T extends MediaItem> {
  readonly posts: Readable<readonly T[]>;
  readonly changed: Occurrence<T>;
  readonly scrollTo?: Occurrence<T>;
  readonly settings: PostGridSettings;
  readonly visiblePosts: Signal<readonly T[]>;
  readonly bitmapDecoder: BitmapDecoder;
  readonly visibilityObserver: VisibilityObserver;
  readonly fetchImage: (media: Media, signal: AbortSignal) => Promise<Blob>;
  readonly getDimensions: (post: T) => Dimensions;
  readonly createActions: (post: T) => readonly Node[];
  readonly resolvePreviewUrl: (media: Media) => Promise<string>;
  readonly getPostUrl?: (post: T) => string;
  readonly onActivatePost: (post: T, event: MouseEvent) => void;
}

export function PostGrid<T extends MediaItem>(props: PostGridProps<T>): HTMLElement {
  return new PostGridImplementation(props).create();
}

class PostGridImplementation<T extends MediaItem> {
  private readonly root: HTMLElement;
  private readonly list: KeyedList<T>;
  private readonly visibleTileTokens = new Map<string, symbol>();

  constructor(private readonly props: PostGridProps<T>) {
    this.root = <div className={PostGridClass.root} />;
    this.list = this.createPostList();
  }

  public create(): HTMLElement {
    const { posts, changed, scrollTo, settings } = this.props;

    effect(() => applyTiling(this.root, { layout: settings.layout.value, size: settings.size.value }));
    effect(() => this.reconcilePosts(posts.value));
    onCleanup(changed.on(post => this.list.recreate(post)));

    if (scrollTo !== undefined) {
      onCleanup(scrollTo.on(post => this.list.get(post)?.scrollIntoView({ block: "center", behavior: "smooth" })));
    }
    return this.root;
  }

  private reconcilePosts(posts: readonly T[]): void {
    const tiles = this.list.reconcile(posts);

    arrangeTiles(this.root, tiles, {
      layout: this.props.settings.layout.value,
      getColumnCount: (): number => Math.round(this.props.settings.size.value)
    });
    const postIds = new Set(posts.map(post => post.id));

    for (const postId of this.visibleTileTokens.keys()) {
      if (!postIds.has(postId)) {
        this.visibleTileTokens.delete(postId);
      }
    }
    this.publishVisiblePosts(posts);
  }

  private setPostVisibility(post: T, tileToken: symbol, isVisible: boolean): void {
    if (isVisible) {
      if (this.visibleTileTokens.get(post.id) === tileToken) {
        return;
      }
      this.visibleTileTokens.set(post.id, tileToken);
    } else {
      if (this.visibleTileTokens.get(post.id) !== tileToken) {
        return;
      }
      this.visibleTileTokens.delete(post.id);
    }
    this.publishVisiblePosts(this.props.posts.peek());
  }

  private publishVisiblePosts(posts: readonly T[]): void {
    this.props.visiblePosts.value = posts.filter(post => this.visibleTileTokens.has(post.id));
  }

  private createPostList(): KeyedList<T> {
    const { getDimensions, createActions, bitmapDecoder, visibilityObserver, fetchImage, resolvePreviewUrl, getPostUrl, onActivatePost, settings } = this.props;
    return new KeyedList<T>({
      getKey: (post): string => post.id,
      create: (post): HTMLElement => {
        const tileToken = Symbol(post.id);
        return (
          <Tile
            post={post}
            dimensions={getDimensions(post)}
            actions={createActions(post)}
            upscale={settings.upscale}
            bitmapDecoder={bitmapDecoder}
            visibilityObserver={visibilityObserver}
            onVisibilityChange={isVisible => this.setPostVisibility(post, tileToken, isVisible)}
            fetchImage={fetchImage}
            resolvePreviewUrl={resolvePreviewUrl}
            href={getPostUrl?.(post)}
            onActivate={event => onActivatePost(post, event)}
          />
        );
      }
    });
  }
}
