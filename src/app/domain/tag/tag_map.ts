import { internString } from "@/app/domain/tag/interner";

type TagSpan = {
  offset: number;
  count: number;
};

let tagIds: Uint16Array | Uint32Array = new Uint16Array(1024);
const vocabulary = new Map<string, number>();
const vocabularyReverse: string[] = [];

let tagsLength = 0;
let vocabularyLength = 0;

export function storeTags(tagString: string): TagSpan {
  const tagNames = tagString.split(" ");
  const offset = tagsLength;

  ensureCapacity(tagsLength + tagNames.length);

  for (const tagName of tagNames) {
    let id = vocabulary.get(tagName);
    const sharedTagName = internString(tagName);

    if (id === undefined) {
      promoteTagIds();
      id = vocabularyLength;
      vocabulary.set(sharedTagName, id);
      vocabularyReverse.push(sharedTagName);
      vocabularyLength += 1;
    }
    tagIds[tagsLength] = id;
    tagsLength += 1;
  }
  return { offset, count: tagNames.length };
}

export function loadTags(span: TagSpan): string {
  const tagNames: string[] = [];

  for (let i = 0; i < span.count; i += 1) {
    const id = tagIds[span.offset + i];

    tagNames.push(vocabularyReverse[id]);
  }
  return tagNames.join(" ");
}

function ensureCapacity(required: number): void {
  if (required <= tagIds.length) {
    return;
  }

  let newLength = tagIds.length * 2;

  while (newLength < required) {
    newLength *= 2;
  }
  const newTagIds = new Uint16Array(newLength);

  newTagIds.set(tagIds);
  tagIds = newTagIds;
}

function promoteTagIds(): void {
  if (tagIds instanceof Uint16Array && vocabularyLength >= 65536) {
    const next = new Uint32Array(tagIds.length);

    next.set(tagIds);
    tagIds = next;
  }
}
