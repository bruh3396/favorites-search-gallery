import { postListUrlFromQuery } from "@/adapters/rule34/client/post_list_page/post_list_page";
import { postPageUrl } from "@/adapters/rule34/client/post_page/post_page";
import { MediaItem } from "@/types/media";
import { Navigation } from "@/core/boundary/ports";
import { resolveMediaUrl } from "@/lib/media/resolver";

export class Rule34Navigation implements Navigation {
  public postUrl(id: string): string {
    return postPageUrl(id);
  }

  public openPost(id: string): void {
    window.open(postPageUrl(id), "_blank");
  }

  public openMedia(item: MediaItem): void {
    resolveMediaUrl(item).then((url) => {
      window.open(url, "_blank");
    });
  }

  public openSearch(query: string): void {
    window.open(postListUrlFromQuery(query));
  }
}
