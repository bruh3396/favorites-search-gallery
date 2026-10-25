import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { GridSizing, computeDecodeWidth } from "@/core/ui/post_grid/decode_width";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { ImageLoaderService } from "@/core/ui/post_grid/image_loader_service";
import { PlainPress } from "@/core/ui/post_grid/plain_press";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { h } from "@/core/ui/h/h";
import { hasMedia } from "@/core/domain/media/media";
import { onCleanup } from "@/core/utils/reactive/scope";

export const TileClass = {
  root: "fsg-Tile",
  link: "fsg-Tile-link",
  preview: "fsg-Tile-preview",
  image: "fsg-Tile-image",
  actions: "fsg-Tile-actions"
} as const;

export interface TileProps {
  post: MediaItem;
  dimensions: Dimensions;
  sizing: Readable<GridSizing>;
  actions: readonly Node[];
  visibilityObserver: VisibilityObserver;
  imageLoaderService: Pick<ImageLoaderService, "resolvePreviewUrl" | "createLoader">;
  href?: string;
  onPlainClick: () => boolean;
  onCtrlClick?: () => void;
}

interface PreviewElements {
  readonly root: HTMLElement;
  readonly preview: HTMLImageElement;
}

const ASPECT_RATIO_PROPERTY = "--fsg-Tile-aspect-ratio";

export function Tile(props: TileProps): HTMLElement {
  const { post, dimensions, sizing, actions, href, onPlainClick, onCtrlClick } = props;
  const visible = new Signal(false);
  const preview = <img className={TileClass.preview} decoding="async" alt="" /> as HTMLImageElement;
  const canvas = <canvas className={TileClass.image} hidden /> as HTMLCanvasElement;
  const plainPress = new PlainPress(onPlainClick);
  const link =
    <a
      className={TileClass.link}
      target="_blank"
      onPointerdown={event => plainPress.press(event)}
      onClick={event => handleClick(event, () => plainPress.release(), onCtrlClick)}
    >
      {preview}{canvas}
    </a> as HTMLAnchorElement;
  const root = (
    <div className={TileClass.root} dataset={{ mediaKind: post.media.kind }}>
      {link}
      <div className={TileClass.actions}>{actions}</div>
    </div>
  );

  setAspectRatio(root, dimensions);
  onCleanup(props.visibilityObserver.observe(root, isVisible => {
    visible.value = isVisible;
  }));

  if (href !== undefined) {
    setHrefOnInteraction(link, href);
  }

  if (hasMedia(post.media)) {
    showPreview({ root, preview }, props.imageLoaderService.resolvePreviewUrl(post.media));
    const targetWidth = computed(() => computeDecodeWidth(sizing.value, dimensions));

    onCleanup(props.imageLoaderService.createLoader(canvas, post.media, targetWidth).trackVisibility(visible));
  }
  return root;
}

function handleClick(event: MouseEvent, onPlainClick: () => boolean, onCtrlClick?: () => void): void {
  if (event.button !== 0 || event.shiftKey || event.altKey) {
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    if (onCtrlClick !== undefined) {
      event.preventDefault();
      onCtrlClick();
    }
  } else if (onPlainClick()) {
    event.preventDefault();
  }
}

function setHrefOnInteraction(link: HTMLAnchorElement, href: string): void {
  const setHref = (): void => link.setAttribute("href", href);
  const removeHref = (): void => link.removeAttribute("href");

  link.tabIndex = 0;
  link.addEventListener("pointerdown", setHref);
  link.addEventListener("focus", () => {
    if (link.matches(":focus-visible")) {
      setHref();
    }
  });
  link.addEventListener("pointerleave", () => {
    if (!link.matches(":focus-visible")) {
      removeHref();
    }
  });
  link.addEventListener("blur", removeHref);
}

function showPreview({ root, preview }: PreviewElements, url: string): void {
  const takeShapeFromPreview = (): void => {
    if (root.style.getPropertyValue(ASPECT_RATIO_PROPERTY) === "") {
      setAspectRatio(root, { width: preview.naturalWidth, height: preview.naturalHeight });
    }
  };

  preview.src = url;
  preview.addEventListener("animationend", () => {
    preview.dataset.entered = "";
  }, { once: true });

  if (preview.complete) {
    preview.decoding = "sync";
    takeShapeFromPreview();
  } else {
    preview.hidden = true;
    preview.addEventListener("load", () => {
      takeShapeFromPreview();
      preview.hidden = false;
    }, { once: true });
  }
}

export function setAspectRatio(root: HTMLElement, { width, height }: Dimensions): void {
  if (width > 0 && height > 0) {
    root.style.setProperty(ASPECT_RATIO_PROPERTY, `${width} / ${height}`);
  }
}
