import "fake-indexeddb/auto";
import { OBSOLETE_DATABASES, purgeObsoleteDatabases } from "@/lib/storage/obsolete_databases";
import { describe, expect, test } from "vitest";

function createDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name);

    request.onsuccess = (): void => {
      request.result.close();
      resolve();
    };
    request.onerror = (): void => reject(request.error);
  });
}

async function databaseNames(): Promise<string[]> {
  return (await indexedDB.databases()).map(database => database.name ?? "");
}

describe("purgeObsoleteDatabases", () => {
  test("deletes every obsolete database and keeps the rest", async() => {
    await Promise.all([...OBSOLETE_DATABASES, "FavoritesV3", "PostsV2"].map(createDatabase));

    purgeObsoleteDatabases();
    await expect.poll(databaseNames).toEqual(expect.not.arrayContaining([...OBSOLETE_DATABASES]));
    expect(await databaseNames()).toEqual(expect.arrayContaining(["FavoritesV3", "PostsV2"]));
  });
});
