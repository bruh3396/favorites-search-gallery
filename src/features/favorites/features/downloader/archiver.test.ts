import { afterEach, describe, expect, test, vi } from "vitest";
import { FavoritesArchiver } from "@/features/favorites/features/downloader/archiver";
import { MediaItem } from "@/types/media";

interface Setup {
  archiver: FavoritesArchiver;
  fetched: string[];
  tagsSeen: Map<string, Set<string>>;
}

function createItem(id: string): MediaItem {
  return { id, thumbUrl: "", mediaType: "image" };
}

function setup({ failing = new Set<string>(), tags = new Map<string, Set<string>>(), onFetch = (): void => undefined } = {}): Setup {
  const fetched: string[] = [];
  const tagsSeen = new Map<string, Set<string>>();
  const archiver = new FavoritesArchiver({
    filenamer: {
      filenameFor: (item, itemTags, extension): string => {
        tagsSeen.set(item.id, itemTags);
        return `${item.id}.${extension}`;
      }
    },
    getTagsForIds: (ids): Promise<Map<string, Set<string>>> => Promise.resolve(new Map([...tags].filter(([id]) => ids.includes(id)))),
    resolveExtension: (): Promise<string> => Promise.resolve("png"),
    resolveMediaUrl: (item): Promise<string> => Promise.resolve(`https://media/${item.id}`),
    fetch: (url, init): Promise<Response> => {
      fetched.push(url);
      onFetch();

      if (init.signal?.aborted === true) {
        return Promise.reject(new DOMException("aborted", "AbortError"));
      }
      const id = url.split("/").pop() ?? "";
      return Promise.resolve(failing.has(id) ? new Response(null, { status: 404, statusText: "Not Found" }) : new Response(new Uint8Array([Number(id)])));
    }
  });
  return { archiver, fetched, tagsSeen };
}

async function entryNamesOf(blob: Blob): Promise<string[]> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const names: string[] = [];
  let offset = 0;

  while (view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);

    names.push(new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLength)));
    offset += 30 + nameLength + extraLength + size;
  }
  return names;
}

async function archive(archiver: FavoritesArchiver, items: MediaItem[], signal = new AbortController().signal): Promise<{ blob: Blob | null; settled: (string | null)[] }> {
  const settled: (string | null)[] = [];
  const blob = await archiver.archive(items, signal, filename => settled.push(filename));
  return { blob, settled };
}

describe("FavoritesArchiver", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("zips every item under its filename and reports each one", async() => {
    const { archiver, fetched } = setup();
    const { blob, settled } = await archive(archiver, [createItem("1"), createItem("2")]);

    expect(fetched.sort()).toEqual(["https://media/1", "https://media/2"]);
    expect(settled.sort()).toEqual(["1.png", "2.png"]);
    expect((await entryNamesOf(blob as Blob)).sort()).toEqual(["1.png", "2.png"]);
  });

  test("names each file from its own tags, or none when it has no tags", async() => {
    const { archiver, tagsSeen } = setup({ tags: new Map([["1", new Set(["a"])], ["9", new Set(["z"])]]) });

    await archive(archiver, [createItem("1"), createItem("2")]);

    expect(tagsSeen).toEqual(new Map([["1", new Set(["a"])], ["2", new Set()]]));
  });

  test("reports a failed fetch as null and leaves it out of the zip", async() => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { archiver } = setup({ failing: new Set(["2"]) });
    const { blob, settled } = await archive(archiver, [createItem("1"), createItem("2")]);

    expect(settled.sort()).toEqual(["1.png", null]);
    expect(await entryNamesOf(blob as Blob)).toEqual(["1.png"]);
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
