import { afterEach, describe, expect, test, vi } from "vitest";
import { DownloaderArchiver } from "@/features/favorites/features/downloader/model/archiver";
import { PostMedia } from "@/core/domain/post/post";
import { TagCategoryMap } from "@/core/domain/tag/tag";

interface Setup {
  archiver: DownloaderArchiver;
  fetched: string[];
  tagsSeen: Map<string, Set<string>>;
  categoriesSeen: TagCategoryMap[];
  categoryRequests: string[][];
}

function createItem(id: string, type = "image/png"): PostMedia {
  return { id, media: { kind: "image", locator: `${id}|${type}` } };
}

function setup({ failing = new Set<string>(), tags = new Map<string, Set<string>>(), onFetch = (): void => undefined } = {}): Setup {
  const fetched: string[] = [];
  const tagsSeen = new Map<string, Set<string>>();
  const categoriesSeen: TagCategoryMap[] = [];
  const categoryRequests: string[][] = [];
  const archiver = new DownloaderArchiver({
    filenamer: {
      filenameFor: (item, itemTags, extension, tagCategories): string => {
        tagsSeen.set(item.id, itemTags);
        categoriesSeen.push(tagCategories);
        return `${item.id}.${extension}`;
      }
    },
    getTagsForIds: (ids): Promise<Map<string, Set<string>>> => Promise.resolve(new Map([...tags].filter(([id]) => ids.includes(id)))),
    getTagCategories: (tagNames): Promise<TagCategoryMap> => {
      categoryRequests.push(tagNames);
      return Promise.resolve(new Map(tagNames.map(tagName => [tagName, "artist"])));
    },
    fetchOriginal: (media, signal): Promise<Blob> => {
      const [id, type] = media.locator.split("|");

      fetched.push(id);
      onFetch();

      if (signal.aborted) {
        return Promise.reject(new DOMException("aborted", "AbortError"));
      }
      return failing.has(id) ? Promise.reject(new Error("404 Not Found")) : Promise.resolve(new Blob([new Uint8Array([Number(id)])], { type }));
    }
  });
  return { archiver, fetched, tagsSeen, categoriesSeen, categoryRequests };
}

async function readEntryNames(blob: Blob): Promise<string[]> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const names: string[] = [];
  let offset = 0;

  while (view.getUint32(offset, true) === 0x04_03_4b_50) {
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);

    names.push(new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLength)));
    offset += 30 + nameLength + extraLength + size;
  }
  return names;
}

async function archive(archiver: DownloaderArchiver, items: PostMedia[], signal = new AbortController().signal): Promise<{ blob: Blob | null; settled: (string | null)[] }> {
  const settled: (string | null)[] = [];
  const blob = await archiver.archive(items, signal, filename => settled.push(filename));
  return { blob, settled };
}

describe("DownloaderArchiver", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("zips every item under its filename and reports each one", async() => {
    const { archiver, fetched } = setup();
    const { blob, settled } = await archive(archiver, [createItem("1"), createItem("2")]);

    expect(fetched.sort()).toEqual(["1", "2"]);
    expect(settled.sort()).toEqual(["1.png", "2.png"]);
    expect((await readEntryNames(blob as Blob)).sort()).toEqual(["1.png", "2.png"]);
  });

  test("names each file's extension after its type", async() => {
    const { archiver } = setup();
    const { settled } = await archive(archiver, [createItem("1", "video/mp4"), createItem("2", "image/gif")]);

    expect(settled.sort()).toEqual(["1.mp4", "2.gif"]);
  });

  test("names each file from its own tags, or none when it has no tags", async() => {
    const { archiver, tagsSeen } = setup({ tags: new Map([["1", new Set(["a"])], ["9", new Set(["z"])]]) });

    await archive(archiver, [createItem("1"), createItem("2")]);

    expect(tagsSeen).toEqual(new Map([["1", new Set(["a"])], ["2", new Set()]]));
  });

  test("reads the categories of every tag in the batch once, and names each file with them", async() => {
    const { archiver, categoriesSeen, categoryRequests } = setup({ tags: new Map([["1", new Set(["a", "b"])], ["2", new Set(["b", "c"])]]) });

    await archive(archiver, [createItem("1"), createItem("2")]);

    expect(categoryRequests).toEqual([["a", "b", "c"]]);
    expect(categoriesSeen).toEqual([new Map([["a", "artist"], ["b", "artist"], ["c", "artist"]]), new Map([["a", "artist"], ["b", "artist"], ["c", "artist"]])]);
  });

  test("reports a failed fetch as null and leaves it out of the zip", async() => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { archiver } = setup({ failing: new Set(["2"]) });
    const { blob, settled } = await archive(archiver, [createItem("1"), createItem("2")]);

    expect(settled.sort()).toEqual(["1.png", null]);
    expect(await readEntryNames(blob as Blob)).toEqual(["1.png"]);
    expect(error).toHaveBeenCalledWith("Failed to archive post 2", new Error("404 Not Found"));
  });

  test("fetches nothing and returns null when already aborted", async() => {
    const { archiver, fetched } = setup();
    const controller = new AbortController();

    controller.abort();
    const { blob, settled } = await archive(archiver, [createItem("1")], controller.signal);

    expect(blob).toBeNull();
    expect(fetched).toEqual([]);
    expect(settled).toEqual([]);
  });

  test("swallows fetch failures caused by aborting mid-archive", async() => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const controller = new AbortController();
    const { archiver } = setup({ onFetch: () => controller.abort() });
    const { blob, settled } = await archive(archiver, [createItem("1")], controller.signal);

    expect(blob).toBeNull();
    expect(settled).toEqual([]);
    expect(error).not.toHaveBeenCalled();
  });
});
