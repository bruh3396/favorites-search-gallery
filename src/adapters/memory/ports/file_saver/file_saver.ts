import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";

export class MemoryFileSaver implements FileSaver {
  public readonly saved: { file: Blob; name: string }[] = [];

  public save(file: Blob, name: string): void {
    this.saved.push({ file, name });
  }
}
