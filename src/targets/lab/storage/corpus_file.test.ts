import { describe, expect, test } from "vitest";
import { CorpusFile } from "@/targets/lab/storage/corpus_file";
import { Post } from "@/core/domain/post/post";

type Writable = Parameters<CorpusFile["export"]>[0];

interface Setup {
  corpusFile: CorpusFile;
  writable: Writable;
  writtenBatches: string[][];
  readChunks: string[][];
  favoriteLists: Map<string, readonly string[]>;
  writes: string[];
  closed: () => boolean;
}

function setup(corpusPostIds: readonly string[] = []): Setup {
  const writtenBatches: string[][] = [];
  const readChunks: string[][] = [];
  const favoriteLists = new Map<string, readonly string[]>([["corpus", corpusPostIds]]);
  const writes: string[] = [];
  let isClosed = false;
  const recordList = (name: string, postIds: readonly string[]): Promise<void> => {
    favoriteLists.set(name, postIds);
    return Promise.resolve();
  };
  const corpusFile = new CorpusFile({ chunkSize: 2 }, {
    localPosts: {
      setMany: (posts: readonly Readonly<Post>[]): Promise<void> => {
        writtenBatches.push(posts.map(post => post.id));
        return Promise.resolve();
      },
      getMany: (ids: readonly string[]): Promise<readonly Readonly<Post>[]> => {
        readChunks.push([...ids]);
        return Promise.resolve(ids.map(id => ({ id }) as Post));
      }
    },
    corpusLocalFavorites: {
      getAll: (): Promise<readonly string[]> => Promise.resolve(favoriteLists.get("corpus") ?? []),
      setAll: (postIds): Promise<void> => recordList("corpus", postIds)
    },
    labLocalFavorites: { setAll: (postIds): Promise<void> => recordList("lab", postIds) }
  });
  const writable: Writable = {
    write: (chunk): Promise<void> => {
      writes.push(chunk as string);
      return Promise.resolve();
    },
    close: (): Promise<void> => {
      isClosed = true;
      return Promise.resolve();
    }
  };
  return { corpusFile, writable, writtenBatches, readChunks, favoriteLists, writes, closed: () => isClosed };
}

function toFile(postIds: readonly string[]): Blob {
  return new Blob(postIds.map(id => `${JSON.stringify({ id })}\n`));
}

describe("CorpusFile", () => {
  describe("import", () => {
    test("writes the posts in chunks, the last one partial", async() => {
      const { corpusFile, writtenBatches } = setup();

      await corpusFile.import(toFile(["5", "4", "3", "2", "1"]), () => undefined);
      expect(writtenBatches).toEqual([["5", "4"], ["3", "2"], ["1"]]);
    });

    test("writes the file's order to both lists", async() => {
      const { corpusFile, favoriteLists } = setup();

      await corpusFile.import(toFile(["3", "2", "1"]), () => undefined);
      expect(Object.fromEntries(favoriteLists)).toEqual({ corpus: ["3", "2", "1"], lab: ["3", "2", "1"] });
    });

    test("skips blank lines and reads a last line without a newline", async() => {
      const { corpusFile, favoriteLists } = setup();

      await corpusFile.import(new Blob(["{\"id\":\"2\"}\r\n\n  \n{\"id\":\"1\"}"]), () => undefined);
      expect(favoriteLists.get("corpus")).toEqual(["2", "1"]);
    });

    test("reports progress ending at the whole file", async() => {
      const { corpusFile } = setup();
      const fractions: number[] = [];

      await corpusFile.import(toFile(["2", "1"]), fraction => fractions.push(fraction));
      expect(fractions.at(-1)).toBe(1);
    });

    test("writes no posts and empties both lists for an empty file", async() => {
      const { corpusFile, writtenBatches, favoriteLists } = setup(["9"]);

      await corpusFile.import(new Blob([]), () => undefined);
      expect([writtenBatches, Object.fromEntries(favoriteLists)]).toEqual([[], { corpus: [], lab: [] }]);
    });
  });

  describe("export", () => {
    test("reads the corpus a chunk at a time and writes each chunk as lines", async() => {
      const { corpusFile, writable, writes, readChunks } = setup(["3", "2", "1"]);

      await corpusFile.export(writable, () => undefined);
      expect(readChunks).toEqual([["3", "2"], ["1"]]);
      expect(writes).toEqual(["{\"id\":\"3\"}\n{\"id\":\"2\"}\n", "{\"id\":\"1\"}\n"]);
    });

    test("reports the share written after each chunk", async() => {
      const { corpusFile, writable } = setup(["4", "3", "2", "1"]);
      const fractions: number[] = [];

      await corpusFile.export(writable, fraction => fractions.push(fraction));
      expect(fractions).toEqual([0.5, 1]);
    });

    test("closes the file once everything is written, even when the corpus is empty", async() => {
      const { corpusFile, writable, writes, closed } = setup();

      await corpusFile.export(writable, () => undefined);
      expect([writes, closed()]).toEqual([[], true]);
    });
  });
});
