import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { PostListApp } from "@/core/app/post_list/post_list_app";

describe("PostListApp", () => {
  test("places the grid followed by the lightbox view", () => {
    const grid = document.createElement("div");
    const lightboxView = document.createElement("dialog");
    const { result: elements } = render(document, () => h(PostListApp, { grid, lightboxView }));

    expect(elements).toEqual([grid, lightboxView]);
  });
});
