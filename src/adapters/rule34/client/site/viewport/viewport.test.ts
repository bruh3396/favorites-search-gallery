import { afterEach, describe, expect, test } from "vitest";
import { lockViewport } from "@/adapters/rule34/client/site/viewport/viewport";

const LOCKED = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";

function viewportsOf(): HTMLMetaElement[] {
  return [...document.head.querySelectorAll<HTMLMetaElement>("meta[name=viewport]")];
}

describe("lockViewport", () => {
  afterEach(() => {
    document.head.replaceChildren();
  });

  test("adds a locked viewport when the page has none", () => {
    lockViewport();
    expect(viewportsOf().map(meta => meta.content)).toEqual([LOCKED]);
  });

  test("locks the page's own viewport instead of adding another", () => {
    const meta = document.createElement("meta");

    meta.name = "viewport";
    meta.content = "width=device-width";
    document.head.append(meta);
    lockViewport();
    expect(viewportsOf()).toEqual([meta]);
    expect(meta.content).toBe(LOCKED);
  });
});
