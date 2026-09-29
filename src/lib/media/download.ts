import { MediaSource } from "@/core/boundary/ports/media_source";
import { PostMedia } from "@/core/domain/post/post";
import { downloadBlob } from "@/utils/browser/download";
import { extensionOfMimeType } from "@/utils/pure/mime";

export async function downloadMedia(mediaSource: Pick<MediaSource, "fetchOriginal">, item: PostMedia): Promise<void> {
  const blob = await mediaSource.fetchOriginal(item.media);

  downloadBlob(blob, `${item.id}.${extensionOfMimeType(blob.type)}`);
}
