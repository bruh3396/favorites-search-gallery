import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { doNothing } from "@/core/utils/function/function";
import { h } from "@/core/ui/h/h";

export const TileClass = {
  root: "fsg-Tile",
  link: "fsg-Tile-link",
  preview: "fsg-Tile-preview",
  actions: "fsg-Tile-actions"
} as const;

export interface Dimensions {
  width: number;
  height: number;
}

export interface TileOptions {
  post: MediaItem;
  dimensions: Dimensions;
  actions: readonly Node[];
  resolvePreviewUrl: (media: Media) => Promise<string>;
}

const ASPECT_RATIO_PROPERTY = "--fsg-Tile-aspect-ratio";

export function Tile({ post, dimensions, actions, resolvePreviewUrl }: TileOptions): HTMLElement {
  const preview = <img className={TileClass.preview} decoding="async" alt="" /> as HTMLImageElement;
  const root = (
    <div className={TileClass.root} dataset={{ mediaKind: post.media.kind, loading: "" }}>
      <a className={TileClass.link}>{preview}</a>
      <div className={TileClass.actions}>{actions}</div>
    </div>
  );

  showAspectRatio(root, dimensions);

  if (post.media.locator !== "") {
    showPreview(root, preview, resolvePreviewUrl(post.media)).catch(console.error);
  }
  return root;
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
