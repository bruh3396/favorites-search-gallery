import { Confirmer } from "@/core/boundary/ports/confirmer/confirmer";

export class BrowserConfirmer implements Confirmer {
  public confirm(question: string): boolean {
    return window.confirm(question);
  }
}
