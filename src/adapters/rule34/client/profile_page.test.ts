import { describe, expect, test } from "vitest";
import { parseFavoriteCount } from "@/adapters/rule34/client/profile_page";

describe("parseFavoriteCount", () => {
  test("reads the count from the favorites link", () => {
    expect(parseFavoriteCount(`
      <a href="https://rule34.xxx/index.php?page=account&s=profile&id=7">Profile</a>
      <a href="https://rule34.xxx/index.php?page=favorites&s=view&id=7">1234</a>
    `)).toBe(1_234);
  });

  test("reads zero from a profile without a favorites link", () => {
    expect(parseFavoriteCount("<p>No such user</p>")).toBe(0);
  });
});
