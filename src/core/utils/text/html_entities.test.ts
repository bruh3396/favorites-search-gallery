import { describe, expect, test } from "vitest";
import { decodeHtmlEntities } from "@/core/utils/text/html_entities";

describe("decodeHtmlEntities", () => {
  test("empty", () => {
    expect(decodeHtmlEntities("")).toBe("");
  });

  test("no entities", () => {
    expect(decodeHtmlEntities("baldurs_gate")).toBe("baldurs_gate");
  });

  test("decodes &amp; to ampersand", () => {
    expect(decodeHtmlEntities("rock_&amp;_roll")).toBe("rock_&_roll");
  });

  test("decodes &apos; to apostrophe", () => {
    expect(decodeHtmlEntities("baldur&apos;s_gate")).toBe("baldur's_gate");
  });

  test("decodes &#39; to apostrophe", () => {
    expect(decodeHtmlEntities("baldur&#39;s_gate")).toBe("baldur's_gate");
  });

  test("decodes zero-padded &#039; to apostrophe", () => {
    expect(decodeHtmlEntities("baldur&#039;s_gate")).toBe("baldur's_gate");
  });

  test("decodes multiple entities", () => {
    expect(decodeHtmlEntities("a&amp;b&#39;c&apos;d")).toBe("a&b'c'd");
  });

  test("decodes repeated occurrences of the same entity", () => {
    expect(decodeHtmlEntities("&amp;&amp;")).toBe("&&");
  });

  test("leaves unrelated entities untouched", () => {
    expect(decodeHtmlEntities("a&lt;b&gt;c")).toBe("a&lt;b&gt;c");
  });
});
