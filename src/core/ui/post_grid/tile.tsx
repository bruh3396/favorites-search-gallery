import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { Media, hasMedia } from "@/core/domain/media/media";
import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Upscaler } from "@/core/ui/post_grid/upscaler";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { doNothing } from "@/core/utils/function/function";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export const TileClass = {
  root: "fsg-Tile",
  link: "fsg-Tile-link",
  preview: "fsg-Tile-preview",
  upscale: "fsg-Tile-upscale",
  actions: "fsg-Tile-actions"
} as const;

export interface TileProps {
  post: MediaItem;
  dimensions: Dimensions;
  actions: readonly Node[];
  upscale: Readable<boolean>;
  visibilityObserver: VisibilityObserver;
  onVisibilityChange: (visible: boolean) => void;
  decodeImage: (media: Media, signal: AbortSignal) => Promise<ImageBitmap>;
  scheduler: Pick<Scheduler, "schedule">;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  href?: string;
  onPlainClick: () => void;
  onCtrlClick?: () => void;
  onPointerEnter?: () => void;
}

const ASPECT_RATIO_PROPERTY = "--fsg-Tile-aspect-ratio";

export function Tile(props: TileProps): HTMLElement {
  const { post, dimensions, actions, upscale, href, onPlainClick, onCtrlClick, onPointerEnter } = props;
  const visible = new Signal(false);
  const preview = <img className={TileClass.preview} decoding="async" alt="" /> as HTMLImageElement;
  const canvas = <canvas className={TileClass.upscale} hidden /> as HTMLCanvasElement;
  const link =
    <a className={TileClass.link} target="_blank" onClick={event => handleClick(event, onPlainClick, onCtrlClick)} onPointerenter={() => onPointerEnter?.()}>
      {preview}{canvas}
    </a> as HTMLAnchorElement;
  const root = (
    <div className={TileClass.root} dataset={{ mediaKind: post.media.kind, loading: "" }}>
      {link}
      <div className={TileClass.actions}>{actions}</div>
    </div>
  );

  setAspectRatio(root, dimensions);
  const unobserve = props.visibilityObserver.observe(root, isVisible => {
    visible.value = isVisible;
    props.onVisibilityChange(isVisible);
  });

  onCleanup(() => {
    unobserve();
    props.onVisibilityChange(false);
  });

  if (href !== undefined) {
    setHrefOnInteraction(link, href);
  }

  if (hasMedia(post.media)) {
    loadPreview(root, preview, props);
    const upscaler = new Upscaler({ canvas, media: post.media, decodeImage: props.decodeImage, scheduler: props.scheduler });

    effect(() => {
      const upscalingEnabled = upscale.value;
      const isVisible = visible.value;

      if (!upscalingEnabled) {
        upscaler.disable();
      } else if (isVisible) {
        upscaler.upscale();
      } else {
        upscaler.dispose();
      }
    });
    onCleanup(() => upscaler.dispose());
  }
  return root;
}

function loadPreview(root: HTMLElement, preview: HTMLImageElement, props: TileProps): Promise<void> {
  return showPreview(root, preview, props.resolvePreviewUrl(props.post.media))
    .catch(error => {
      console.error(error);
    });
}

function handleClick(event: MouseEvent, onPlainClick: () => void, onCtrlClick?: () => void): void {
  if (event.button !== 0 || event.shiftKey || event.altKey) {
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    if (onCtrlClick !== undefined) {
      event.preventDefault();
      onCtrlClick();
    }
  } else {
    event.preventDefault();
    onPlainClick();
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

async function showPreview(root: HTMLElement, preview: HTMLImageElement, url: Promise<string>): Promise<void> {
  preview.src = await url;
  await preview.decode().catch(doNothing);

  if (root.style.getPropertyValue(ASPECT_RATIO_PROPERTY) === "") {
    setAspectRatio(root, { width: preview.naturalWidth, height: preview.naturalHeight });
  }
  delete root.dataset.loading;
}

export function setAspectRatio(root: HTMLElement, { width, height }: Dimensions): void {
  if (width > 0 && height > 0) {
    root.style.setProperty(ASPECT_RATIO_PROPERTY, `${width} / ${height}`);
  }
}
