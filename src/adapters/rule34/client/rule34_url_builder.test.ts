import {
  buildRule34AddFavoriteUrl,
  buildRule34FavoritesPageUrl,
  buildRule34PostListPageUrl,
  buildRule34PostListUrl,
  buildRule34PostPageUrl,
  buildRule34PostVoteUrl,
  buildRule34ProfilePageUrl,
  buildRule34RemoveFavoriteUrl
} from "@/adapters/rule34/client/rule34_url_builder";
import { describe, expect, test } from "vitest";

describe("buildRule34FavoritesPageUrl", () => {
  test("addresses a page of a user's favorites by its post offset", () => {
    expect(buildRule34FavoritesPageUrl("9", 2)).toBe("https://rule34.xxx/index.php?page=favorites&s=view&id=9&pid=100");
  });
});

describe("buildRule34PostListUrl", () => {
  test("addresses a search, encoding its query", () => {
    expect(buildRule34PostListUrl("apple banana")).toBe("https://rule34.xxx/index.php?page=post&s=list&tags=apple%20banana");
  });
});

describe("buildRule34PostListPageUrl", () => {
  test("addresses a page of a search by its post offset", () => {
    expect(buildRule34PostListPageUrl("apple banana", 2)).toBe("https://rule34.xxx/index.php?page=post&s=list&tags=apple%20banana&pid=84");
  });
});

describe("buildRule34PostPageUrl", () => {
  test("addresses a post's page", () => {
    expect(buildRule34PostPageUrl("42")).toBe("https://rule34.xxx/index.php?page=post&s=view&id=42");
  });
});

describe("buildRule34ProfilePageUrl", () => {
  test("addresses a user's profile", () => {
    expect(buildRule34ProfilePageUrl("9")).toBe("https://rule34.xxx/index.php?page=account&s=profile&id=9");
  });
});

describe("favorite action urls", () => {
  test("address adding, upvoting, and removing a favorite", () => {
    expect(buildRule34AddFavoriteUrl("7")).toBe("https://rule34.xxx/public/addfav.php?id=7");
    expect(buildRule34PostVoteUrl("7")).toBe("https://rule34.xxx/index.php?page=post&s=vote&type=up&id=7");
    expect(buildRule34RemoveFavoriteUrl("7")).toBe("https://rule34.xxx/index.php?page=favorites&s=delete&id=7");
  });
});
