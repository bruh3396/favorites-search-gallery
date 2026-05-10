import * as ExtensionResolver from "../../media/media_extension_resolver";
import { DEFAULT_EXTENSION } from "../../environment/constants";
import { download } from "../../../utils/browser/download";
import { resolveMediaUrl } from "../../media/media_url_resolver";

export async function downloadFromThumb(thumb: HTMLElement): Promise<void> {
  const originalContentUrl = await resolveMediaUrl(thumb);
  const extension = ExtensionResolver.extractExtensionFromUrl(originalContentUrl) ?? DEFAULT_EXTENSION;
  const filename = `${thumb.id}.${extension}`;

  download(originalContentUrl, filename);
}
