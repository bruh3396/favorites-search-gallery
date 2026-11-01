import { describe, expect, test } from "vitest";
import { parseRule34ProfileFavoriteCount } from "@/adapters/rule34/client/rule34_profile_favorite_count_parser";

describe("parseRule34ProfileFavoriteCount", () => {
  test("reads the count from the favorites link", () => {
    expect(parseRule34ProfileFavoriteCount(`
      <a href="https://rule34.xxx/index.php?page=account&s=profile&id=7">Profile</a>
      <a href="https://rule34.xxx/index.php?page=favorites&s=view&id=7">1234</a>
    `)).toBe(1_234);
  });

  test("reads zero from a profile without a favorites link", () => {
    expect(parseRule34ProfileFavoriteCount("<p>No such user</p>")).toBe(0);
  });
});
