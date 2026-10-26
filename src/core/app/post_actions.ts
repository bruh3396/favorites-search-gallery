import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";
import { MediaItem } from "@/core/domain/media/media_item";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";

export interface PostActionsDependencies {
  remoteMedia: Pick<RemoteMedia, "resolveOriginalUrl" | "fetchOriginal">;
  remotePages: Pick<RemotePages, "postUrl">;
  navigator: Pick<Navigator, "open">;
  fileSaver: Pick<FileSaver, "save">;
}

export class PostActions {
  constructor(private readonly dependencies: PostActionsDependencies) { }

  public openPostPage(item: MediaItem): void {
    this.dependencies.navigator.open(this.dependencies.remotePages.postUrl(item.id));
  }

  public openOriginal(item: MediaItem): void {
    this.dependencies.remoteMedia.resolveOriginalUrl(item.media)
      .then(url => this.dependencies.navigator.open(url))
      .catch(console.error);
  }

  public download(item: MediaItem): void {
    this.dependencies.remoteMedia.fetchOriginal(item.media)
      .then(file => this.dependencies.fileSaver.save(file, nameDownload(item.id, file)))
      .catch(() => this.openOriginal(item));
  }
}

function nameDownload(id: string, file: Blob): string {
  const subtype = file.type.split("/")[1];
  return subtype === undefined || subtype === "" ? id : `${id}.${subtype}`;
}
