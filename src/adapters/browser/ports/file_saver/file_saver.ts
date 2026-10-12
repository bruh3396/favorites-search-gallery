import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";

export class BrowserFileSaver implements FileSaver {
  constructor(private readonly ownerDocument: Document) { }

  public save(file: Blob, name: string): void {
    const url = URL.createObjectURL(file);
    const link = this.ownerDocument.createElement("a");

    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url));
  }
}
