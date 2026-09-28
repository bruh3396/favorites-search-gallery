import { MediaItem } from "@/types/media";
import { Navigation } from "@/core/boundary/ports";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { resolveMediaUrl } from "@/lib/media/resolver";

export class Rule34Navigation implements Navigation {
  constructor(private readonly site: Pick<Rule34Client, "postPageUrl" | "postListUrl">) { }

  public postUrl(id: string): string {
    return this.site.postPageUrl(id);
  }

  public openPost(id: string): void {
    window.open(this.site.postPageUrl(id), "_blank");
  }

  public openMedia(item: MediaItem): void {
    resolveMediaUrl(item).then((url) => {
      window.open(url, "_blank");
    });
  }

  public openSearch(query: string): void {
    window.open(this.site.postListUrl(query));
  }
}
