import { describe, expect, test } from "vitest";
import { RULE34_URLS } from "@/adapters/rule34/client/rule34_urls";

describe("RULE34_URLS", () => {
  test("addresses a page of a user's favorites by its post offset", () => {
    expect(RULE34_URLS.favoritesPage("9", 2)).toBe("https://rule34.xxx/index.php?page=favorites&s=view&id=9&pid=100");
  });

  test("addresses a search, encoding its query", () => {
    expect(RULE34_URLS.postList("apple banana")).toBe("https://rule34.xxx/index.php?page=post&s=list&tags=apple%20banana");
  });

  test("addresses a page of a search by its post offset", () => {
    expect(RULE34_URLS.postListPage("apple banana", 2)).toBe("https://rule34.xxx/index.php?page=post&s=list&tags=apple%20banana&pid=84");
  });

  test("addresses a post's page", () => {
    expect(RULE34_URLS.postPage("42")).toBe("https://rule34.xxx/index.php?page=post&s=view&id=42");
  });

  test("addresses a user's profile", () => {
    expect(RULE34_URLS.profilePage("9")).toBe("https://rule34.xxx/index.php?page=account&s=profile&id=9");
  });

  test("addresses the logged-in user's account home", () => {
    expect(RULE34_URLS.accountHomePage()).toBe("https://rule34.xxx/index.php?page=account&s=home");
  });

  test("addresses adding, upvoting, and removing a favorite", () => {
    expect(RULE34_URLS.addFavorite("7")).toBe("https://rule34.xxx/public/addfav.php?id=7");
    expect(RULE34_URLS.postVote("7")).toBe("https://rule34.xxx/index.php?page=post&s=vote&type=up&id=7");
    expect(RULE34_URLS.removeFavorite("7")).toBe("https://rule34.xxx/index.php?page=favorites&s=delete&id=7");
  });
});
