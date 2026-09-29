import { Links } from "@/core/boundary/ports/links";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";

export class Rule34Links implements Links {
  constructor(private readonly rule34: Pick<Rule34SiteClient, "postPageUrl" | "postListUrl">) { }

  public postUrl(id: string): string {
    return this.rule34.postPageUrl(id);
  }

  public openInNewTab(url: string): void {
    window.open(url, "_blank");
  }

  public openSearchInNewTab(query: string): void {
    window.open(this.rule34.postListUrl(query));
  }
}
