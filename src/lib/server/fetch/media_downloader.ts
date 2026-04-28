import * as ExtensionCache from "../../extension_cache";
import { download } from "../../../utils/browser/download";
import { resolveMediaURL } from "../url/media_url_resolver";

export async function downloadFromThumb(thumb: HTMLElement): Promise<void> {
  const originalContentURL = await resolveMediaURL(thumb);
  const extension = ExtensionCache.getExtensionFromURL(originalContentURL) ?? "jpg";
  const filename = `${thumb.id}.${extension}`;

  download(originalContentURL, filename);
}
