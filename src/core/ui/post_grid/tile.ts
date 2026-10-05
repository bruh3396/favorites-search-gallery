import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { doNothing } from "@/core/utils/function/function";

export const TileClass = {
  root: "fsg-Tile",
  link: "fsg-Tile-link",
  preview: "fsg-Tile-preview"
} as const;

export interface Dimensions {
  width: number;
  height: number;
}

export interface TileOptions {
  post: MediaItem;
  dimensions: Dimensions;
  resolvePreviewUrl: (media: Media) => Promise<string>;
}

const ASPECT_RATIO_PROPERTY = "--fsg-Tile-aspect-ratio";

export function createTile(ownerDocument: Document, { post, dimensions, resolvePreviewUrl }: TileOptions): HTMLElement {
  const root = ownerDocument.createElement("div");
  const link = ownerDocument.createElement("a");
  const preview = ownerDocument.createElement("img");

  root.className = TileClass.root;
  root.dataset.mediaKind = post.media.kind;
  root.dataset.loading = "";
  showAspectRatio(root, dimensions);
  link.className = TileClass.link;
  preview.className = TileClass.preview;
  preview.decoding = "async";
  preview.alt = "";
  link.append(preview);
  root.append(link);

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
