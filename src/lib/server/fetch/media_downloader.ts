import * as ExtensionCache from "../../media/extension_cache";
import { DEFAULT_EXTENSION } from "../../environment/constants";
import { download } from "../../../utils/browser/download";
import { resolveMediaURL } from "../url/media_url_resolver";

export async function downloadFromThumb(thumb: HTMLElement): Promise<void> {
  const originalContentURL = await resolveMediaURL(thumb);
  const extension = ExtensionCache.getExtensionFromURL(originalContentURL) ?? DEFAULT_EXTENSION;
  const filename = `${thumb.id}.${extension}`;

  download(originalContentURL, filename);
}
