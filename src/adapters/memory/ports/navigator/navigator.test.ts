import { describe, expect, test } from "vitest";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/navigator";

describe("MemoryNavigator", () => {
  test("records each place it was asked to open, in order", () => {
    const navigator = new MemoryNavigator();

    navigator.open("data:image/png;base64,AA");
    navigator.open("#search-apple");
    expect(navigator.opened).toEqual(["data:image/png;base64,AA", "#search-apple"]);
  });
});
