import { describe, expect, test, vi } from "vitest";
import { FilesystemRemoteFavoriteActions } from "@/adapters/filesystem/ports/remote_favorite_actions/remote_favorite_actions";

describe("FilesystemRemoteFavoriteActions", () => {
  test("deletes the post's file on remove", async() => {
    const filesystem = { deletePostFile: vi.fn(() => Promise.resolve()) };

    expect(await new FilesystemRemoteFavoriteActions(filesystem).remove("1")).toBe("removed");
    expect(filesystem.deletePostFile).toHaveBeenCalledWith("1");
  });

  test("succeeds on add", async() => {
    expect(await new FilesystemRemoteFavoriteActions({ deletePostFile: (): Promise<void> => Promise.resolve() }).add()).toBe("added");
  });
});
