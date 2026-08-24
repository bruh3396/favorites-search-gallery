const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP64_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06064b50;
const ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIGNATURE = 0x07064b50;
const ZIP64_EXTRA_FIELD_TAG = 0x0001;
const VERSION_ZIP64 = 45;
const UTF8_FLAG = 0x0800;
const ZIP64_THRESHOLD = 0xffffffff;
const ZIP64_COUNT_THRESHOLD = 0xffff;

const crcTable = buildCrcTable();

type Bytes = Uint8Array<ArrayBuffer>;

type Entry = {
  nameBytes: Bytes;
  crc: number;
  size: number;
  offset: number;
};

export class ZipWriter {
  private readonly parts: Bytes[] = [];
  private readonly entries: Entry[] = [];
  private offset = 0;

  public add(filename: string, data: Bytes): void {
    const nameBytes = new TextEncoder().encode(filename) as Bytes;
    const crc = crc32(data);
    const requiresZip64 = data.length >= ZIP64_THRESHOLD;
    const header = buildLocalFileHeader(nameBytes, crc, data.length, requiresZip64);

    this.entries.push({ nameBytes, crc, size: data.length, offset: this.offset });
    this.push(header);
    this.push(data);
  }

  public finish(): Blob {
    const centralDirectoryOffset = this.offset;
    let centralDirectorySize = 0;

    for (const entry of this.entries) {
      const record = buildCentralDirectoryRecord(entry);

      centralDirectorySize += record.length;
      this.parts.push(record);
    }
    this.offset += centralDirectorySize;
    this.push(buildEndOfCentralDirectory(this.entries.length, centralDirectorySize, centralDirectoryOffset));
    return new Blob(this.parts, { type: "application/zip" });
  }

  private push(bytes: Bytes): void {
    this.parts.push(bytes);
    this.offset += bytes.length;
  }
}

function buildLocalFileHeader(nameBytes: Bytes, crc: number, size: number, requiresZip64: boolean): Bytes {
  const extra = requiresZip64 ? buildZip64ExtraField(size, size) : new Uint8Array(0);
  const header = new Uint8Array(30 + nameBytes.length + extra.length);
  const view = new DataView(header.buffer);
  const storedSize = requiresZip64 ? ZIP64_THRESHOLD : size;

  view.setUint32(0, LOCAL_FILE_HEADER_SIGNATURE, true);
  view.setUint16(4, requiresZip64 ? VERSION_ZIP64 : 20, true);
  view.setUint16(6, UTF8_FLAG, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, storedSize, true);
  view.setUint32(22, storedSize, true);
  view.setUint16(26, nameBytes.length, true);
  view.setUint16(28, extra.length, true);
  header.set(nameBytes, 30);
  header.set(extra, 30 + nameBytes.length);
  return header;
}

function buildCentralDirectoryRecord(entry: Entry): Bytes {
  const requiresZip64 = entry.size >= ZIP64_THRESHOLD || entry.offset >= ZIP64_THRESHOLD;
  const extra = requiresZip64 ? buildZip64ExtraField(entry.size, entry.offset) : new Uint8Array(0);
  const record = new Uint8Array(46 + entry.nameBytes.length + extra.length);
  const view = new DataView(record.buffer);
  const storedSize = requiresZip64 ? ZIP64_THRESHOLD : entry.size;
  const storedOffset = requiresZip64 ? ZIP64_THRESHOLD : entry.offset;

  view.setUint32(0, CENTRAL_DIRECTORY_SIGNATURE, true);
  view.setUint16(4, requiresZip64 ? VERSION_ZIP64 : 20, true);
  view.setUint16(6, requiresZip64 ? VERSION_ZIP64 : 20, true);
  view.setUint16(8, UTF8_FLAG, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, entry.crc, true);
  view.setUint32(20, storedSize, true);
  view.setUint32(24, storedSize, true);
  view.setUint16(28, entry.nameBytes.length, true);
  view.setUint16(30, extra.length, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, storedOffset, true);
  record.set(entry.nameBytes, 46);
  record.set(extra, 46 + entry.nameBytes.length);
  return record;
}

function buildZip64ExtraField(size: number, offset: number): Uint8Array {
  const extra = new Uint8Array(28);
  const view = new DataView(extra.buffer);

  view.setUint16(0, ZIP64_EXTRA_FIELD_TAG, true);
  view.setUint16(2, 24, true);
  setUint64(view, 4, size);
  setUint64(view, 12, size);
  setUint64(view, 20, offset);
  return extra;
}

function buildEndOfCentralDirectory(count: number, size: number, offset: number): Bytes {
  const needsZip64 = count >= ZIP64_COUNT_THRESHOLD || size >= ZIP64_THRESHOLD || offset >= ZIP64_THRESHOLD;
  const zip64 = needsZip64 ? buildZip64EndRecords(count, size, offset) : new Uint8Array(0);
  const end = new Uint8Array(zip64.length + 22);
  const view = new DataView(end.buffer, zip64.length);

  end.set(zip64, 0);
  view.setUint32(0, END_OF_CENTRAL_DIRECTORY_SIGNATURE, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, needsZip64 ? ZIP64_COUNT_THRESHOLD : count, true);
  view.setUint16(10, needsZip64 ? ZIP64_COUNT_THRESHOLD : count, true);
  view.setUint32(12, needsZip64 ? ZIP64_THRESHOLD : size, true);
  view.setUint32(16, needsZip64 ? ZIP64_THRESHOLD : offset, true);
  view.setUint16(20, 0, true);
  return end;
}

function buildZip64EndRecords(count: number, size: number, offset: number): Uint8Array {
  const records = new Uint8Array(56 + 20);
  const record = new DataView(records.buffer, 0, 56);
  const locator = new DataView(records.buffer, 56, 20);

  record.setUint32(0, ZIP64_END_OF_CENTRAL_DIRECTORY_SIGNATURE, true);
  setUint64(record, 4, 44);
  record.setUint16(12, VERSION_ZIP64, true);
  record.setUint16(14, VERSION_ZIP64, true);
  record.setUint32(16, 0, true);
  record.setUint32(20, 0, true);
  setUint64(record, 24, count);
  setUint64(record, 32, count);
  setUint64(record, 40, size);
  setUint64(record, 48, offset);

  locator.setUint32(0, ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIGNATURE, true);
  locator.setUint32(4, 0, true);
  setUint64(locator, 8, offset + size);
  locator.setUint32(16, 1, true);
  return records;
}

function setUint64(view: DataView, position: number, value: number): void {
  view.setUint32(position, value >>> 0, true);
  view.setUint32(position + 4, Math.floor(value / 0x100000000), true);
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}
