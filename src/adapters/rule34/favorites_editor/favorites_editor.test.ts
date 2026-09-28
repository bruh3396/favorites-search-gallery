import { describe, expect, test } from "vitest";
import { Rule34FavoritesEditor } from "@/adapters/rule34/favorites_editor/favorites_editor";

function createEditor(addAnswer: string | null, removeSent = true): Rule34FavoritesEditor {
  return new Rule34FavoritesEditor({
    addFavorite: () => Promise.resolve(addAnswer),
    removeFavorite: () => Promise.resolve(removeSent)
  });
}

describe("Rule34FavoritesEditor", () => {
  test.each([
    ["0", "error"],
    ["1", "alreadyAdded"],
    ["2", "loggedOut"],
    ["3", "success"],
    ["?", "error"]
  ])("reads the site's add answer %s as %s", async(siteAnswer, status) => {
    expect(await createEditor(siteAnswer).add("7")).toBe(status);
  });

  test("reads a cancelled add as an error", async() => {
    expect(await createEditor(null).add("7")).toBe("error");
  });

  test("reads a sent remove as a success and a cancelled one as an error", async() => {
    expect(await createEditor("3", true).remove("8")).toBe("success");
    expect(await createEditor("3", false).remove("8")).toBe("error");
  });
});
