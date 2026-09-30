import { afterEach, describe, expect, test } from "vitest";
import { ColorScheme } from "@/core/boundary/environment";
import { setTheme } from "@/adapters/rule34/client/site/theme/theme";

describe("setTheme", () => {
  afterEach(() => {
    document.cookie = "theme=; max-age=0; path=/";
  });

  test.each<[ColorScheme, string]>([
    ["dark", "theme=dark"],
    ["light", "theme=light"]
  ])("remembers the theme in the site's cookie (%s)", (colorScheme, cookie) => {
    setTheme(colorScheme);
    expect(document.cookie).toContain(cookie);
  });
});
