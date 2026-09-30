import { afterEach, describe, expect, test } from "vitest";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/host_page";
import { Shell } from "@/app/context/shell";
import { createAppContext } from "@/testing/context";
import { setupStyles } from "@/app/startup/style";

describe("setupStyles", () => {
  afterEach(() => {
    document.head.replaceChildren();
  });

  test("tells the host page when the color scheme changes", () => {
    const hostPage = new MemoryHostPage();
    const context = createAppContext({ shell: new Shell(), ports: { hostPage } });

    setupStyles(context);
    context.preferences.app.colorScheme.set("dark");
    expect(hostPage.colorScheme).toBe("dark");
    context.preferences.app.colorScheme.set("light");
    expect(hostPage.colorScheme).toBe("light");
  });
});
