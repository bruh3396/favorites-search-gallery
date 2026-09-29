import { describe, expect, test } from "vitest";
import { Rule34FavoritesEditor } from "@/adapters/rule34/ports/favorites_editor/favorites_editor";

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
    ["3", "added"],
    ["?", "error"]
  ])("reads the site's add answer %s as %s", async(siteAnswer, result) => {
    expect(await createEditor(siteAnswer).add("7")).toBe(result);
  });

  test("reports an add cancelled by a later remove", async() => {
    expect(await createEditor(null).add("7")).toBe("cancelled");
  });

  test("reports a sent remove as removed and one cancelled by a later add as cancelled", async() => {
    expect(await createEditor("3", true).remove("8")).toBe("removed");
    expect(await createEditor("3", false).remove("8")).toBe("cancelled");
  });
});
