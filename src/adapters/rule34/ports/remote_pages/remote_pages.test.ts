import { describe, expect, test } from "vitest";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/remote_pages";

const rule34 = {
  postPageUrl: (id: string): string => `post:${id}`,
  postListUrl: (query: string): string => `list:${query}`
};

describe("Rule34RemotePages", () => {
  test("gives a post's URL as its post page", () => {
    expect(new Rule34RemotePages(rule34).postUrl("7")).toBe("post:7");
  });

  test("gives a search's URL as a post list", () => {
    expect(new Rule34RemotePages(rule34).searchUrl("apple banana")).toBe("list:apple banana");
  });
});
