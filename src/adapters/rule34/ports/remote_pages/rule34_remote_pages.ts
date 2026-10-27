import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { Rule34Client } from "@/adapters/rule34/client/rule34_client";

export class Rule34RemotePages implements RemotePages {
  constructor(private readonly rule34: Pick<Rule34Client, "postPageUrl" | "postListUrl">) { }

  public postUrl(id: string): string {
    return this.rule34.postPageUrl(id);
  }

  public searchUrl(query: string): string {
    return this.rule34.postListUrl(query);
  }
}
