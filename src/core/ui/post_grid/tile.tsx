import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { Media } from "@/core/domain/media/media";
import { doNothing } from "@/core/utils/function/function";
import { h } from "@/core/ui/h/h";

export const TileClass = {
  root: "fsg-Tile",
  link: "fsg-Tile-link",
  preview: "fsg-Tile-preview",
  actions: "fsg-Tile-actions"
} as const;

export interface TileProps {
  post: MediaItem;
  dimensions: Dimensions;
  actions: readonly Node[];
  resolvePreviewUrl: (media: Media) => Promise<string>;
  href?: string;
  onActivate: (event: MouseEvent) => void;
}

const ASPECT_RATIO_PROPERTY = "--fsg-Tile-aspect-ratio";

export function Tile({ post, dimensions, actions, resolvePreviewUrl, href, onActivate }: TileProps): HTMLElement {
  const preview = <img className={TileClass.preview} decoding="async" alt="" /> as HTMLImageElement;
  const link = <a className={TileClass.link} target="_blank" onClick={event => activateOnPlainClick(event, onActivate)}>{preview}</a> as HTMLAnchorElement;
  const root = (
    <div className={TileClass.root} dataset={{ mediaKind: post.media.kind, loading: "" }}>
      {link}
      <div className={TileClass.actions}>{actions}</div>
    </div>
  );

  showAspectRatio(root, dimensions);

  if (href !== undefined) {
    setHrefOnInteraction(link, href);
  }

  if (post.media.locator !== "") {
    showPreview(root, preview, resolvePreviewUrl(post.media)).catch(console.error);
  }
  return root;
}

function activateOnPlainClick(event: MouseEvent, onActivate: (event: MouseEvent) => void): void {
  if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    onActivate(event);
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
    showAspectRatio(root, { width: preview.naturalWidth, height: preview.naturalHeight });
  }
  delete root.dataset.loading;
}

function showAspectRatio(root: HTMLElement, { width, height }: Dimensions): void {
  if (width > 0 && height > 0) {
    root.style.setProperty(ASPECT_RATIO_PROPERTY, `${width} / ${height}`);
  }
}
