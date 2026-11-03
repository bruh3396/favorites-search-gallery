import { describe, expect, test } from "vitest";
import { parseRule34UserId } from "@/adapters/rule34/client/rule34_user_id_parser";

function createAccountHomePage(profileHref: string): string {
  return `
    <div id="user-index">
      <p>Make like a tree and get out of here!</p>
      <h4><a href="${profileHref}">» My Profile</a></h4>
    </div>
  `;
}

describe("parseRule34UserId", () => {
  test("reads the logged-in user from the account home page's profile link", () => {
    expect(parseRule34UserId(createAccountHomePage("index.php?page=account&amp;s=profile&amp;id=3702166"))).toBe("3702166");
  });

  test("reads nothing from the logged-out account home page", () => {
    expect(parseRule34UserId("<form action=\"index.php?page=account&amp;s=login&amp;code=00\"></form>")).toBe("");
  });

  test("ignores profile links outside the account index", () => {
    expect(parseRule34UserId("<a href=\"index.php?page=account&amp;s=profile&amp;id=7\">Someone</a>")).toBe("");
  });

  test("reads nothing from a profile link without a numeric id", () => {
    expect(parseRule34UserId(createAccountHomePage("index.php?page=account&amp;s=profile&amp;id=abc"))).toBe("");
  });
});
