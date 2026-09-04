import "fake-indexeddb/auto";
import { Database, KeyedDatabase } from "@/lib/storage/database";
import { beforeEach, describe, expect, it } from "vitest";

type Record = { id: string; value: number };

let counter = 0;
const uniqueName = (): string => {
  counter += 1;
  return `TestDb_${Date.now()}_${counter}`;
};

describe("Database (autoIncrement + unique id index)", () => {
  let database: Database<Record>;

  beforeEach(() => {
    database = new Database<Record>(uniqueName(), "records");
  });

  it("writes and reads records by id", async() => {
    await database.write([{ id: "1", value: 10 }, { id: "2", value: 20 }]);

    expect(await database.readMany(["1", "2"])).toHaveLength(2);
    expect((await database.readMany(["1"]))[0]).toEqual({ id: "1", value: 10 });
  });

  it("readMany skips missing ids", async() => {
    await database.write([{ id: "1", value: 10 }]);

    expect(await database.readMany(["1", "missing"])).toHaveLength(1);
  });

  it("update overwrites an existing record by id", async() => {
    await database.write([{ id: "1", value: 10 }]);
    await database.update([{ id: "1", value: 99 }]);

    const records = await database.readMany(["1"]);

    expect(records).toHaveLength(1);
    expect(records[0].value).toBe(99);
  });

  it("readAllIds returns every id", async() => {
    await database.write([{ id: "a", value: 1 }, { id: "b", value: 2 }]);

    expect((await database.readAllIds()).sort()).toEqual(["a", "b"]);
  });

  it("readAllIds preserves insertion order, not id order", async() => {
    await database.write([{ id: "50", value: 1 }, { id: "8", value: 2 }, { id: "30", value: 3 }]);

    expect(await database.readAllIds()).toEqual(["50", "8", "30"]);
  });

  it("readMany returns records in the order of the requested ids", async() => {
    await database.write([{ id: "1", value: 1 }, { id: "2", value: 2 }, { id: "3", value: 3 }]);

    expect((await database.readMany(["3", "1", "2"])).map(record => record.id)).toEqual(["3", "1", "2"]);
  });

  it("delete removes a record by id", async() => {
    await database.write([{ id: "1", value: 10 }, { id: "2", value: 20 }]);
    await database.delete(["1"]);

    expect(await database.readMany(["1"])).toHaveLength(0);
    expect(await database.readMany(["2"])).toHaveLength(1);
  });

  it("count reflects stored records", async() => {
    await database.write([{ id: "1", value: 10 }, { id: "2", value: 20 }]);

    expect(await database.count()).toBe(2);
  });
});

describe("KeyedDatabase (id as keyPath)", () => {
  let database: KeyedDatabase<Record>;

  beforeEach(() => {
    database = new KeyedDatabase<Record>(uniqueName(), "records");
  });

  it("write of the same id twice upserts instead of throwing", async() => {
    await database.write([{ id: "1", value: 10 }]);
    await database.write([{ id: "1", value: 20 }]);

    const records = await database.readMany(["1"]);

    expect(records).toHaveLength(1);
    expect(records[0].value).toBe(20);
  });

  it("insertIfAbsent seeds a new id", async() => {
    await database.insertIfAbsent([{ id: "1", value: 10 }]);

    expect((await database.readMany(["1"]))[0].value).toBe(10);
  });

  it("insertIfAbsent does NOT overwrite an existing record", async() => {
    await database.write([{ id: "1", value: 99 }]);
    await database.insertIfAbsent([{ id: "1", value: 10 }]);

    expect((await database.readMany(["1"]))[0].value).toBe(99);
  });

  it("insertIfAbsent seeds only the absent ids in a mixed batch", async() => {
    await database.write([{ id: "1", value: 99 }]);
    await database.insertIfAbsent([{ id: "1", value: 10 }, { id: "2", value: 20 }]);

    expect((await database.readMany(["1"]))[0].value).toBe(99);
    expect((await database.readMany(["2"]))[0].value).toBe(20);
  });

  it("readMany, readAllIds, and delete work by id", async() => {
    await database.write([{ id: "a", value: 1 }, { id: "b", value: 2 }]);

    expect((await database.readAllIds()).sort()).toEqual(["a", "b"]);

    await database.delete(["a"]);

    expect(await database.readMany(["a"])).toHaveLength(0);
    expect((await database.readMany(["b"]))[0].value).toBe(2);
  });
});
