import { describe, expect, test } from "vitest";
import { Resource } from "@/core/utils/reactive/resource";
import { Signal } from "@/core/utils/reactive/signal";
import { createScope } from "@/core/utils/reactive/scope";

async function settle(): Promise<void> {
  for (let turn = 0; turn < 5; turn += 1) {
    await Promise.resolve();
  }
}

describe("Resource", () => {
  test("loads a defined source and clears its value when the source becomes undefined", async() => {
    const source = new Signal<number | undefined>(undefined);
    const disposed: string[] = [];
    const scoped = createScope(() => new Resource({
      source,
      load: (value): string => `value-${value}`,
      disposeValue: (value): void => {
        disposed.push(value);
      }
    }));

    expect(scoped.result.loading.value).toBe(false);
    expect(scoped.result.value.value).toBeUndefined();

    source.value = 1;
    expect(scoped.result.loading.value).toBe(true);
    await settle();
    expect(scoped.result.value.value).toBe("value-1");
    expect(scoped.result.loading.value).toBe(false);

    source.value = undefined;
    expect(scoped.result.value.value).toBeUndefined();
    expect(scoped.result.loading.value).toBe(false);
    expect(disposed).toEqual(["value-1"]);
    scoped.dispose();
  });

  test("publishes a load failure and clears it for the next request", async() => {
    const source = new Signal<number | undefined>(1);
    const failure = new Error("load failed");
    const scoped = createScope(() => new Resource({
      source,
      load: (value): string | Promise<string> => {
        if (value === 1) {
          return Promise.reject(failure);
        }
        return `value-${value}`;
      }
    }));

    await settle();
    expect(scoped.result.error.value).toBe(failure);
    expect(scoped.result.loading.value).toBe(false);

    source.value = 2;
    expect(scoped.result.error.value).toBeUndefined();
    await settle();
    expect(scoped.result.value.value).toBe("value-2");
    scoped.dispose();
  });

  test("disposes stale successful results and ignores stale failures", async() => {
    const source = new Signal<number | undefined>(1);
    let resolve: (value: string) => void = () => undefined;
    let reject: (reason: unknown) => void = () => undefined;
    const disposed: string[] = [];
    const scoped = createScope(() => new Resource({
      source,
      load: (value): string | Promise<string> => {
        if (value === 1) {
          return new Promise<string>(done => {
            resolve = done;
          });
        }

        if (value === 2) {
          return new Promise<string>((_done, fail) => {
            reject = fail;
          });
        }
        return `value-${value}`;
      },
      disposeValue: (value): void => {
        disposed.push(value);
      }
    }));

    source.value = 2;
    await settle();
    resolve("stale");
    await settle();
    expect(disposed).toEqual(["stale"]);

    source.value = 3;
    await settle();
    source.value = 4;
    await settle();
    reject(new Error("stale failure"));
    await settle();
    expect(scoped.result.error.value).toBeUndefined();
    expect(scoped.result.value.value).toBe("value-4");
    scoped.dispose();
  });

  test("ignores a successful result after disposal and disposes current values once", async() => {
    const source = new Signal<number | undefined>(1);
    let resolve: (value: string) => void = () => undefined;
    const disposed: string[] = [];
    const scoped = createScope(() => new Resource({
      source,
      load: (): Promise<string> => new Promise<string>(done => {
        resolve = done;
      }),
      disposeValue: (value): void => {
        disposed.push(value);
      }
    }));

    await settle();
    scoped.dispose();
    scoped.result.dispose();
    resolve("after-dispose");
    await settle();
    expect(scoped.result.value.value).toBeUndefined();
    expect(disposed).toEqual(["after-dispose"]);
  });

  test("uses the default disposer", async() => {
    const scoped = createScope(() => new Resource({
      source: new Signal<number | undefined>(1),
      load: (value): number => value
    }));

    await settle();
    expect(scoped.result.value.value).toBe(1);
    scoped.dispose();
  });
});
