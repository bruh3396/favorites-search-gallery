import { afterEach, describe, expect, test } from "vitest";
import { setHeaderVisible } from "@/adapters/rule34/client/site/header/header";

function addHeader(): HTMLElement {
  const header = document.createElement("div");

  header.id = "header";
  document.body.append(header);
  return header;
}

describe("setHeaderVisible", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test("hides the site's header, then shows it again", () => {
    const header = addHeader();

    setHeaderVisible(false);
    expect(header.style.display).toBe("none");
    setHeaderVisible(true);
    expect(header.style.display).toBe("");
  });

  test("does nothing when the page has no header", () => {
    expect(() => setHeaderVisible(false)).not.toThrow();
  });
});
