import { describe, expect, test, vi } from "vitest";
import { FilesystemFavoritesEditor } from "@/adapters/filesystem/favorites_editor/favorites_editor";

describe("FilesystemFavoritesEditor", () => {
  test("removing deletes the post's file", async() => {
    const files = { deletePostFile: vi.fn(() => Promise.resolve()) };

    expect(await new FilesystemFavoritesEditor(files).remove("1")).toBe("success");
    expect(files.deletePostFile).toHaveBeenCalledWith("1");
  });

  test("adding succeeds", async() => {
    expect(await new FilesystemFavoritesEditor({ deletePostFile: () => Promise.resolve() }).add()).toBe("success");
  });
});
