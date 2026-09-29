import { AppMode } from "@/core/boundary/environment";
import { Host } from "@/core/boundary/ports/host";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";

type Rule34 = Pick<Rule34SiteClient, "clearNativePage" | "setHeaderVisible" | "lockViewport">;

const TAKE_OVERS: Record<AppMode, (rule34: Rule34) => void> = {
  favorites: (rule34) => rule34.clearNativePage(),
  postList: () => { }
};

export class Rule34Host implements Host {
  constructor(private readonly rule34: Rule34, private readonly mode: AppMode) { }

  public readonly hasHeader = true;

  public setHeaderVisible(visible: boolean): void {
    this.rule34.setHeaderVisible(visible);
  }

  public takeOver(): void {
    TAKE_OVERS[this.mode](this.rule34);
  }

  public lockViewport(): void {
    this.rule34.lockViewport();
  }
}
