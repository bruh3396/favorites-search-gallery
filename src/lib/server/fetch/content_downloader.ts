import * as ExtensionCache from "../../extension_cache";
import { download } from "../../../utils/browser/download";
import { resolveContentURL } from "../url/media_url_resolver";

export async function downloadFromThumb(thumb: HTMLElement): Promise<void> {
  const originalContentURL = await resolveContentURL(thumb);
  const extension = ExtensionCache.getExtensionFromURL(originalContentURL) ?? "jpg";
  const filename = `${thumb.id}.${extension}`;

  download(originalContentURL, filename);
}
