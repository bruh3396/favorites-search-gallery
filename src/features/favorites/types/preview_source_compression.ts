const SOURCE_ID_SIZE = 2;
const HASH_LENGTH_SIZE = 1;
const MAX_HASH_SIZE = 20;
const PREVIEW_SOURCE_SIZE = SOURCE_ID_SIZE + HASH_LENGTH_SIZE + MAX_HASH_SIZE;
const PREVIEW_SOURCE_CAPACITY = 100000;
const previewSourceBuffer = new Uint8Array(PREVIEW_SOURCE_SIZE * PREVIEW_SOURCE_CAPACITY);
let previewSourceCount = 0;

export function storePreviewSource(source: string): number {
  const index = previewSourceCount;

  previewSourceCount += 1;
  const offset = index * PREVIEW_SOURCE_SIZE;

  const [sourceId, hex] = source.split("_");
  const hashSize = hex.length / 2;

  const view = new DataView(
    previewSourceBuffer.buffer,
    offset,
    PREVIEW_SOURCE_SIZE
  );

  view.setUint16(0, Number(sourceId));
  previewSourceBuffer[offset + SOURCE_ID_SIZE] = hashSize;

  for (let i = 0; i < hashSize; i += 1) {
    previewSourceBuffer[offset + SOURCE_ID_SIZE + HASH_LENGTH_SIZE + i] =
      parseInt(hex.slice(i * 2, (i * 2) + 2), 16);
  }
  return index;
}

export function loadPreviewSource(index: number): string {
  const offset = index * PREVIEW_SOURCE_SIZE;

  const view = new DataView(
    previewSourceBuffer.buffer,
    offset,
    PREVIEW_SOURCE_SIZE
  );

  const sourceId = view.getUint16(0);
  const hashSize = previewSourceBuffer[offset + SOURCE_ID_SIZE];

  let hex = "";

  for (let i = 0; i < hashSize; i += 1) {
    hex += previewSourceBuffer[
      offset + SOURCE_ID_SIZE + HASH_LENGTH_SIZE + i
    ]
      .toString(16)
      .padStart(2, "0");
  }
  return `${sourceId}_${hex}`;
}
