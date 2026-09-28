import { MediaItem } from "@/types/media";
import { Navigation } from "@/core/boundary/ports/navigation";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { resolveMediaUrl } from "@/lib/media/resolver";

export class Rule34Navigation implements Navigation {
  constructor(private readonly rule34: Pick<Rule34SiteClient, "postPageUrl" | "postListUrl">) { }

  public postUrl(id: string): string {
    return this.rule34.postPageUrl(id);
  }

  public openPost(id: string): void {
    window.open(this.rule34.postPageUrl(id), "_blank");
  }

  public openMedia(item: MediaItem): void {
    resolveMediaUrl(item).then((url) => {
      window.open(url, "_blank");
    });
  }

  public openSearch(query: string): void {
    window.open(this.rule34.postListUrl(query));
  }
}
