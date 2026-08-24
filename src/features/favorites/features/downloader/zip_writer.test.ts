import { describe, expect, it } from "vitest";
import { ZipWriter } from "@/features/favorites/features/downloader/zip_writer";
import { crc32 as nodeCrc32 } from "zlib";

async function entriesOf(blob: Blob): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const result = new Map<string, Uint8Array>();
  let offset = 0;

  while (view.getUint32(offset, true) === 0x04034b50) {
    const crc = view.getUint32(offset + 14, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = new TextDecoder().decode(bytes.subarray(nameStart, nameStart + nameLength));
    const data = bytes.subarray(dataStart, dataStart + size);

    expect(nodeCrc32(Buffer.from(data))).toBe(crc);
    result.set(name, data);
    offset = dataStart + size;
  }
  expect(view.getUint32(offset, true)).toBe(0x02014b50);
  return result;
}

describe("ZipWriter", () => {
  it("stores a single file with correct name, contents, and crc", async() => {
    const writer = new ZipWriter();
    const payload = new TextEncoder().encode("hello world") as Uint8Array<ArrayBuffer>;

    writer.add("greeting.txt", payload);
    const entries = await entriesOf(writer.finish());

    expect([...entries.keys()]).toEqual(["greeting.txt"]);
    expect(new TextDecoder().decode(entries.get("greeting.txt"))).toBe("hello world");
  });

  it("stores multiple files with binary content", async() => {
    const writer = new ZipWriter();
    const a = new Uint8Array([0, 1, 2, 255, 128]) as Uint8Array<ArrayBuffer>;
    const b = new Uint8Array(1000).map((_, i) => i % 256) as Uint8Array<ArrayBuffer>;

    writer.add("a.bin", a);
    writer.add("b.bin", b);
    const entries = await entriesOf(writer.finish());

    expect([...entries.keys()]).toEqual(["a.bin", "b.bin"]);
    expect(entries.get("a.bin")).toEqual(a);
    expect(entries.get("b.bin")).toEqual(b);
  });

  it("handles unicode filenames", async() => {
    const writer = new ZipWriter();

    writer.add("画像 🎨.png", new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>);
    const entries = await entriesOf(writer.finish());

    expect([...entries.keys()]).toEqual(["画像 🎨.png"]);
  });

  it("produces an empty but valid archive", async() => {
    const bytes = new Uint8Array(await new ZipWriter().finish().arrayBuffer());
    const view = new DataView(bytes.buffer);

    expect(view.getUint32(0, true)).toBe(0x06054b50);
    expect(view.getUint16(8, true)).toBe(0);
  });
});
