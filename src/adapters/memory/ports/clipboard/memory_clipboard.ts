import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";

export class MemoryClipboard implements Clipboard {
  public text = "";

  public write(text: string): Promise<void> {
    this.text = text;
    return Promise.resolve();
  }
}
