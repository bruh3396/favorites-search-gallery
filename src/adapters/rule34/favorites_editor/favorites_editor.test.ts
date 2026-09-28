import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Rule34FavoritesEditor } from "@/adapters/rule34/favorites_editor/favorites_editor";

let answer = "3";

describe("Rule34FavoritesEditor", () => {
  beforeEach(() => {
    answer = "3";
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(answer))));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test.each([
    ["0", "error"],
    ["1", "alreadyAdded"],
    ["2", "loggedOut"],
    ["3", "success"],
    ["?", "error"]
  ])("reads the site's add answer %s as %s", async(siteAnswer, status) => {
    answer = siteAnswer;
    expect(await new Rule34FavoritesEditor().add("7")).toBe(status);
  });

  test("reads an add cancelled by a remove as an error", async() => {
    const editor = new Rule34FavoritesEditor();
    const first = editor.add("1");
    const second = editor.add("2");

    await editor.remove("2");
    await first;
    expect(await second).toBe("error");
  });

  test("reads a sent remove as a success", async() => {
    expect(await new Rule34FavoritesEditor().remove("8")).toBe("success");
  });

  test("reads a remove cancelled by an add as an error", async() => {
    const editor = new Rule34FavoritesEditor();
    const first = editor.remove("1");
    const second = editor.remove("2");

    await editor.add("2");
    await first;
    expect(await second).toBe("error");
  });
});
