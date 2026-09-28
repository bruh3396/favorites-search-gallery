import { AppMode } from "@/core/boundary/environment";
import { Host } from "@/core/boundary/ports";
import { Rule34Client } from "@/adapters/rule34/client/client";

export class Rule34Host implements Host {
  private readonly takeOvers: Record<AppMode, () => void> = {
    favorites: () => this.site.clearNativePage(),
    posts: () => { }
  };

  constructor(private readonly site: Pick<Rule34Client, "clearNativePage">) { }

  public takeOver(mode: AppMode): void {
    this.takeOvers[mode]();
  }
}
