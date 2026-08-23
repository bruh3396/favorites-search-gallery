import { describe, expect, test } from "vitest";
import { parseIdFromThumb } from "@/lib/thumb/post_id";

interface FakeAnchor {
  id: string;
  href: string;
  hasId: boolean;
  hasHref: boolean;
}

function createAnchor(overrides: Partial<FakeAnchor> = {}): FakeAnchor {
  return {
    id: "",
    href: "",
    hasId: false,
    hasHref: false,
    ...overrides
  };
}

function createThumb(options: { id?: string | null; anchor?: FakeAnchor | null; imageSrc?: string | null }): HTMLElement {
  const { id = null, anchor = null, imageSrc = null } = options;
  return {
    getAttribute: (name: string) => (name === "id" ? id : null),
    querySelector: (selector: string) => {
      if (selector === "a") {
        return anchor === null ? null : {
          id: anchor.id,
          href: anchor.href,
          hasAttribute: (name: string) => (name === "id" ? anchor.hasId : name === "href" ? anchor.hasHref : false)
        };
      }

      if (selector === "img") {
        return imageSrc === null ? null : { src: imageSrc };
      }
      return null;
    }
  } as unknown as HTMLElement;
}

describe("parseIdFromThumb", () => {
  test("strips non-numeric characters from the thumb's own id attribute", () => {
    expect(parseIdFromThumb(createThumb({ id: "p123456" }))).toBe("123456");
  });

  test("falls back to the anchor's id when the thumb has no id", () => {
    expect(parseIdFromThumb(createThumb({ anchor: createAnchor({ id: "s987", hasId: true }) }))).toBe("987");
  });

  test("falls back to the anchor's href when the anchor has no id", () => {
    const t = createThumb({ anchor: createAnchor({ href: "https://rule34.xxx/index.php?page=post&s=view&id=42", hasHref: true }) });

    expect(parseIdFromThumb(t)).toBe("42");
  });

  test("falls back to the image src query string when no id or usable anchor exists", () => {
    expect(parseIdFromThumb(createThumb({ imageSrc: "https://cdn.rule34.xxx/thumb.jpg?55" }))).toBe("55");
  });

  test("prefers the thumb id over the anchor and image", () => {
    const t = createThumb({
      id: "1",
      anchor: createAnchor({ id: "2", hasId: true }),
      imageSrc: "https://cdn.rule34.xxx/thumb.jpg?3"
    });

    expect(parseIdFromThumb(t)).toBe("1");
  });

  test("returns 'NA' when nothing yields an id and there is no image", () => {
    expect(parseIdFromThumb(createThumb({}))).toBe("NA");
  });

  test("returns 'NA' when the image src has no trailing numeric query", () => {
    expect(parseIdFromThumb(createThumb({ imageSrc: "https://cdn.rule34.xxx/thumb.jpg" }))).toBe("NA");
  });

  test("returns 'NA' when the anchor href has no id and there is no image", () => {
    const t = createThumb({ anchor: createAnchor({ href: "https://rule34.xxx/index.php?page=post", hasHref: true }) });

    expect(parseIdFromThumb(t)).toBe("NA");
  });
});
