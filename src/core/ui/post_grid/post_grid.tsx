import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { GridLayout, applyTiling, arrangeTiles } from "@/core/ui/post_grid/tiler";
import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { KeyedList } from "@/core/ui/post_grid/keyed_list";
import { Media } from "@/core/domain/media/media";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Tile } from "@/core/ui/post_grid/tile";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";
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
  posts: Readable<readonly T[]>;
  changed: Occurrence<T>;
  scrollTo?: Occurrence<T>;
  tileLocator?: TileLocator<T>;
  settings: PostGridSettings;
  visiblePosts: Signal<readonly T[]>;
  visibilityObserver: VisibilityObserver;
  decodeImage: (media: Media, signal: AbortSignal) => Promise<ImageBitmap>;
  scheduler: Pick<Scheduler, "schedule">;
  getDimensions: (post: T) => Dimensions;
  createActions: (post: T) => readonly Node[];
  resolvePreviewUrl: (media: Media) => Promise<string>;
  getPostUrl?: (post: T) => string;
  onPlainClick: (post: T) => void;
  onCtrlClick?: (post: T) => void;
  onPointerEnter?: (post: T) => void;
}

export function PostGrid<T extends MediaItem>(props: PostGridProps<T>): HTMLElement {
  return new PostGridImplementation(props).create();
}

class PostGridImplementation<T extends MediaItem> {
  private readonly root: HTMLElement;
  private readonly list: KeyedList<T>;
  private readonly visiblePostIds = new Set<string>();

  constructor(private readonly props: PostGridProps<T>) {
    this.root = <div className={PostGridClass.root} />;
    this.list = this.createPostList();
  }

  public create(): HTMLElement {
    const { posts, changed, scrollTo, tileLocator, settings } = this.props;

    effect(() => applyTiling(this.root, { layout: settings.layout.value, size: settings.size.value }));
    effect(() => this.reconcilePosts(posts.value));
    onCleanup(changed.on(post => this.list.recreate(post)));

    if (scrollTo !== undefined) {
      onCleanup(scrollTo.on(post => this.list.get(post)?.scrollIntoView({ block: "center", behavior: "instant" })));
    }

    if (tileLocator !== undefined) {
      onCleanup(tileLocator.attach(post => this.list.get(post)));
    }
    return this.root;
  }

  private reconcilePosts(posts: readonly T[]): void {
    const tiles = this.list.reconcile(posts);

    arrangeTiles(this.root, tiles, {
      layout: this.props.settings.layout.value,
      getColumnCount: (): number => Math.round(this.props.settings.size.value)
    });
    this.publishVisiblePosts(posts);
  }

  private markVisible(post: T): void {
    if (!this.visiblePostIds.has(post.id)) {
      this.visiblePostIds.add(post.id);
      this.publishVisiblePosts(this.props.posts.peek());
    }
  }

  private markHidden(post: T): void {
    if (this.visiblePostIds.delete(post.id)) {
      this.publishVisiblePosts(this.props.posts.peek());
    }
  }

  private publishVisiblePosts(posts: readonly T[]): void {
    this.props.visiblePosts.value = posts.filter(post => this.visiblePostIds.has(post.id));
  }

  private createPostList(): KeyedList<T> {
    const {
      getDimensions, createActions, visibilityObserver, decodeImage, scheduler, resolvePreviewUrl, getPostUrl,
      onPlainClick, onCtrlClick, onPointerEnter, settings
    } = this.props;
    return new KeyedList<T>({
      getKey: (post): string => post.id,
      create: (post): HTMLElement => (
        <Tile
          post={post}
          dimensions={getDimensions(post)}
          actions={createActions(post)}
          upscale={settings.upscale}
          visibilityObserver={visibilityObserver}
          onVisibilityChange={isVisible => (isVisible ? this.markVisible(post) : this.markHidden(post))}
          decodeImage={decodeImage}
          scheduler={scheduler}
          resolvePreviewUrl={resolvePreviewUrl}
          href={getPostUrl?.(post)}
          onPlainClick={() => onPlainClick(post)}
          onCtrlClick={onCtrlClick === undefined ? undefined : (): void => onCtrlClick(post)}
          onPointerEnter={() => onPointerEnter?.(post)}
        />
      )
    });
  }
}
