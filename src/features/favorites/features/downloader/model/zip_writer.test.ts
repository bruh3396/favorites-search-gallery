import { describe, expect, test } from "vitest";
import { DownloaderZipWriter } from "@/features/favorites/features/downloader/model/zip_writer";
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

describe("DownloaderZipWriter", () => {
  test("stores a single file with correct name, contents, and crc", async() => {
    const writer = new DownloaderZipWriter();
    const payload = new TextEncoder().encode("hello world") as Uint8Array<ArrayBuffer>;

    writer.add("greeting.txt", payload);
    const entries = await entriesOf(writer.finish());

    expect([...entries.keys()]).toEqual(["greeting.txt"]);
    expect(new TextDecoder().decode(entries.get("greeting.txt"))).toBe("hello world");
  });

  test("stores multiple files with binary content", async() => {
    const writer = new DownloaderZipWriter();
    const a = new Uint8Array([0, 1, 2, 255, 128]) as Uint8Array<ArrayBuffer>;
    const b = new Uint8Array(1000).map((_, i) => i % 256) as Uint8Array<ArrayBuffer>;

    writer.add("a.bin", a);
    writer.add("b.bin", b);
    const entries = await entriesOf(writer.finish());

    expect([...entries.keys()]).toEqual(["a.bin", "b.bin"]);
    expect(entries.get("a.bin")).toEqual(a);
    expect(entries.get("b.bin")).toEqual(b);
  });

  test("handles unicode filenames", async() => {
    const writer = new DownloaderZipWriter();

    writer.add("画像 🎨.png", new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>);
    const entries = await entriesOf(writer.finish());

    expect([...entries.keys()]).toEqual(["画像 🎨.png"]);
  });

  test("produces an empty but valid archive", async() => {
    const bytes = new Uint8Array(await new DownloaderZipWriter().finish().arrayBuffer());
    const view = new DataView(bytes.buffer);

    expect(view.getUint32(0, true)).toBe(0x06054b50);
    expect(view.getUint16(8, true)).toBe(0);
  });

  test("writes zip64 end records when the entry count reaches the 16-bit limit", async() => {
    const writer = new DownloaderZipWriter();
    const count = 0xffff;

    for (let index = 0; index < count; index += 1) {
      writer.add("f", new Uint8Array(0));
    }
    const bytes = new Uint8Array(await writer.finish().arrayBuffer());
    const end = new DataView(bytes.buffer, bytes.length - 22);
    const locator = new DataView(bytes.buffer, bytes.length - 42, 20);
    const record = new DataView(bytes.buffer, bytes.length - 98, 56);

    expect(end.getUint32(0, true)).toBe(0x06054b50);
    expect(end.getUint16(8, true)).toBe(0xffff);
    expect(end.getUint32(16, true)).toBe(0xffffffff);
    expect(locator.getUint32(0, true)).toBe(0x07064b50);
    expect(record.getUint32(0, true)).toBe(0x06064b50);
    expect(record.getBigUint64(24, true)).toBe(BigInt(count));
  });

  test("writes a zip64 extra field for an entry of at least 4 GiB", async() => {
    const writer = new DownloaderZipWriter();
    const size = 2 ** 32;
    const huge = { length: size, *[Symbol.iterator](): Generator<number> {} } as unknown as Uint8Array<ArrayBuffer>;

    writer.add("big.bin", huge);
    const header = new DataView(await writer.finish().slice(0, 30 + "big.bin".length + 28).arrayBuffer());
    const extra = 30 + "big.bin".length;

    expect(header.getUint16(4, true)).toBe(45);
    expect(header.getUint32(18, true)).toBe(0xffffffff);
    expect(header.getUint16(28, true)).toBe(28);
    expect(header.getUint16(extra, true)).toBe(0x0001);
    expect(header.getBigUint64(extra + 4, true)).toBe(BigInt(size));
  });
});
