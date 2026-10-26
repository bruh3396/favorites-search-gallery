import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { GridLayout } from "@/core/ui/post_grid/grid_layout";
import { tileGrid } from "@/core/ui/post_grid/grid_tiler";
import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { GridSizing } from "@/core/ui/post_grid/grid_sizing";
import { ImageLoaderService } from "@/core/ui/post_grid/image_loader_service";
import { KeyedList } from "@/core/ui/h/keyed_list";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
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
  readonly columnCount: Readable<number>;
}

export interface PostGridProps<T extends MediaItem> {
  posts: Readable<readonly T[]>;
  changed: Occurrence<T>;
  tileLocator?: TileLocator<T>;
  settings: PostGridSettings;
  visibilityObserver: VisibilityObserver;
  sizeObserver: SizeObserver;
  imageLoaderService: Pick<ImageLoaderService, "resolvePreviewUrl" | "createLoader">;
  getDimensions: (post: T) => Dimensions;
  createActions: (post: T) => readonly Node[];
  getPostUrl?: (post: T) => string;
  onPlainClick: (post: T) => boolean;
  onCtrlClick?: (post: T) => void;
}

export function PostGrid<T extends MediaItem>(props: PostGridProps<T>): HTMLElement {
  return new PostGridImplementation(props).create();
}

class PostGridImplementation<T extends MediaItem> {
  private readonly root: HTMLElement;
  private readonly gridWidth: Signal<number>;
  private readonly sizing: Readable<GridSizing>;
  private readonly list: KeyedList<T>;

  constructor(private readonly props: PostGridProps<T>) {
    const { layout, columnCount } = props.settings;

    this.root = <div className={PostGridClass.root} />;
    this.gridWidth = new Signal(0);
    this.sizing = computed(() => ({ layout: layout.value, columnCount: columnCount.value, gridWidth: this.gridWidth.value }));
    this.list = this.createPostList();
  }

  public create(): HTMLElement {
    const { posts, changed, tileLocator, sizeObserver } = this.props;

    onCleanup(sizeObserver.observe(this.root, size => {
      this.gridWidth.value = size.devicePixelWidth;
    }));
    effect(() => this.reconcilePosts(posts.value));
    onCleanup(changed.on(post => this.list.recreate(post)));

    if (tileLocator !== undefined) {
      onCleanup(tileLocator.attach(post => this.list.get(post)));
    }
    return this.root;
  }

  private reconcilePosts(posts: readonly T[]): void {
    const { layout, columnCount } = this.props.settings;

    tileGrid(this.root, this.list.reconcile(posts), { layout: layout.value, columnCount: columnCount.value });
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
          sizing={this.sizing}
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
