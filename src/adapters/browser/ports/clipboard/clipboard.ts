import { Clipboard } from "@/core/boundary/ports/clipboard/clipboard";

export class BrowserClipboard implements Clipboard {
  constructor(private readonly systemClipboard: Pick<globalThis.Clipboard, "writeText">) { }

  public write(text: string): Promise<void> {
    return this.systemClipboard.writeText(text);
  }
}
