import { describe, expect, test, vi } from "vitest";
import { FilesystemFavoritesEditor } from "@/adapters/filesystem/ports/favorites_editor/favorites_editor";

describe("FilesystemFavoritesEditor", () => {
  test("removing deletes the post's file", async() => {
    const filesystem = { deletePostFile: vi.fn(() => Promise.resolve()) };

    expect(await new FilesystemFavoritesEditor(filesystem).remove("1")).toBe("removed");
    expect(filesystem.deletePostFile).toHaveBeenCalledWith("1");
  });

  test("adding succeeds", async() => {
    expect(await new FilesystemFavoritesEditor({ deletePostFile: () => Promise.resolve() }).add()).toBe("added");
  });
});
