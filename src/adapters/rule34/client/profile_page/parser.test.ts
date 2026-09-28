import { describe, expect, test } from "vitest";
import { parseFavoritesCount } from "@/adapters/rule34/client/profile_page/parser";

describe("parseFavoritesCount", () => {
  test("reads the count from the favorites link", () => {
    expect(parseFavoritesCount(`
      <a href="https://rule34.xxx/index.php?page=account&s=profile&id=7">Profile</a>
      <a href="https://rule34.xxx/index.php?page=favorites&s=view&id=7">1234</a>
    `)).toBe(1234);
  });

  test("reads zero from a profile without a favorites link", () => {
    expect(parseFavoritesCount("<p>No such user</p>")).toBe(0);
  });
});
