import { describe, expect, test } from "vitest";
import { MemoryFileSaver } from "@/adapters/memory/ports/file_saver/memory_file_saver";

describe("MemoryFileSaver", () => {
  test("remembers each saved file in order", () => {
    const fileSaver = new MemoryFileSaver();
    const first = new Blob(["a"]);
    const second = new Blob(["b"]);

    fileSaver.save(first, "a.png");
    fileSaver.save(second, "b.mp4");
    expect(fileSaver.saved).toEqual([{ file: first, name: "a.png" }, { file: second, name: "b.mp4" }]);
  });
});
