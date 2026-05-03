import * as ExtensionResolver from "../../media/media_extension_resolver";
import { DEFAULT_EXTENSION } from "../../environment/constants";
import { download } from "../../../utils/browser/download";
import { resolveMediaURL } from "../url/media_url_resolver";

export async function downloadFromThumb(thumb: HTMLElement): Promise<void> {
  const originalContentURL = await resolveMediaURL(thumb);
  const extension = ExtensionResolver.extractExtensionFromURL(originalContentURL) ?? DEFAULT_EXTENSION;
  const filename = `${thumb.id}.${extension}`;

  download(originalContentURL, filename);
}
