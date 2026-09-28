import { AppMode } from "@/core/boundary/environment";
import { Host } from "@/core/boundary/ports/host";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";

export class Rule34Host implements Host {
  private readonly takeOvers: Record<AppMode, () => void> = {
    favorites: () => this.rule34.clearNativePage(),
    posts: () => { }
  };

  constructor(private readonly rule34: Pick<Rule34SiteClient, "clearNativePage">) { }

  public takeOver(mode: AppMode): void {
    this.takeOvers[mode]();
  }
}
