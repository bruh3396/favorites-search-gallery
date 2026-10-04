import { PostMedia } from "@/core/domain/post/post";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { downloadBlob } from "@/utils/browser/download";
import { extensionOfMimeType } from "@/utils/pure/mime";

export async function downloadMedia(remoteMedia: Pick<RemoteMedia, "fetchOriginal">, item: PostMedia): Promise<void> {
  const blob = await remoteMedia.fetchOriginal(item.media);

  downloadBlob(blob, `${item.id}.${extensionOfMimeType(blob.type)}`);
}
