import {describe, expect, test} from "vitest";
import {cleanImageSource} from "../../utils/image/image";

describe("cleanImageSource", () => {
  test("empty", () => {
    expect("").toBe("");
  });

  test("one subdomain", () => {
    const source = "https://wimg.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const source1 = "https://wimg1.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const source2 = "https://wimg2.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const expected = "https://rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";

    expect(cleanImageSource(source)).toBe(expected);
    expect(cleanImageSource(source1)).toBe(expected);
    expect(cleanImageSource(source2)).toBe(expected);
    expect(cleanImageSource("wimg.rule34.xxx")).toBe("rule34.xxx");
  });

  test("two subdomains", () => {
    const source = "https://wimg.foo.rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const expected = "https://rule34.xxx/thumbnails//1234/thumbnail_123456789abcdef.jpg?123456";
    const actual = cleanImageSource(source);

    expect(actual).toBe(expected);
  });
});
