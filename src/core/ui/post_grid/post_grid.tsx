import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { GridLayout, applyTiling, arrangeTiles } from "@/core/ui/post_grid/tiler";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { ImageLoaderService } from "@/core/ui/post_grid/image_loader_service";
import { KeyedList } from "@/core/ui/h/keyed_list";
import { Occurrence } from "@/core/utils/reactive/emitter";
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
  readonly tilesPerRow: Readable<number>;
}

export interface PostGridProps<T extends MediaItem> {
  posts: Readable<readonly T[]>;
  changed: Occurrence<T>;
  tileLocator?: TileLocator<T>;
  settings: PostGridSettings;
  visibilityObserver: VisibilityObserver;
  imageLoaderService: Pick<ImageLoaderService, "resolvePreviewUrl" | "createLoader">;
  getDimensions: (post: T) => Dimensions;
  createActions: (post: T) => readonly Node[];
  getPostUrl?: (post: T) => string;
  onPlainClick: (post: T) => void;
  onCtrlClick?: (post: T) => void;
}

export function PostGrid<T extends MediaItem>(props: PostGridProps<T>): HTMLElement {
  return new PostGridImplementation(props).create();
}

class PostGridImplementation<T extends MediaItem> {
  private readonly root: HTMLElement;
  private readonly list: KeyedList<T>;

  constructor(private readonly props: PostGridProps<T>) {
    this.root = <div className={PostGridClass.root} />;
    this.list = this.createPostList();
  }

  public create(): HTMLElement {
    const { posts, changed, tileLocator, settings } = this.props;

    effect(() => applyTiling(this.root, { layout: settings.layout.value, tilesPerRow: settings.tilesPerRow.value }));
    effect(() => this.reconcilePosts(posts.value));
    onCleanup(changed.on(post => this.list.recreate(post)));

    if (tileLocator !== undefined) {
      onCleanup(tileLocator.attach(post => this.list.get(post)));
    }
    return this.root;
  }

  private reconcilePosts(posts: readonly T[]): void {
    const tiles = this.list.reconcile(posts);

    arrangeTiles(this.root, tiles, {
      layout: this.props.settings.layout.value,
      getColumnCount: (): number => Math.round(this.props.settings.tilesPerRow.value)
    });
  }

  private createPostList(): KeyedList<T> {
    const {
      getDimensions, createActions, visibilityObserver, imageLoaderService, getPostUrl,
      onPlainClick, onCtrlClick
    } = this.props;
    return new KeyedList<T>({
      getKey: (post): string => post.id,
      create: (post): HTMLElement => (
        <Tile
          post={post}
          dimensions={getDimensions(post)}
          actions={createActions(post)}
          visibilityObserver={visibilityObserver}
          imageLoaderService={imageLoaderService}
          href={getPostUrl?.(post)}
          onPlainClick={() => onPlainClick(post)}
          onCtrlClick={onCtrlClick === undefined ? undefined : (): void => onCtrlClick(post)}
        />
      )
    });
  }
}
