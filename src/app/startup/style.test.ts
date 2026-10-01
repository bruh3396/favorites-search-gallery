import { afterEach, describe, expect, test, vi } from "vitest";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/host_page";
import { Shell } from "@/app/context/shell";
import { createAppContext } from "@/testing/context";
import { setupStyles } from "@/app/startup/style";

describe("setupStyles", () => {
  afterEach(() => {
    document.head.replaceChildren();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-tooltips");
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

  test("leaves the host page's color scheme alone until it changes", () => {
    const hostPage = new MemoryHostPage();
    const context = createAppContext({ shell: new Shell(), preferences: { app: { colorScheme: "dark" } }, ports: { hostPage } });

    setupStyles(context);
    expect(hostPage.colorScheme).toBe("light");
  });

  test("the theme follows its color scheme", async() => {
    const context = createAppContext({ shell: new Shell() });

    setupStyles(context);
    context.preferences.app.colorScheme.set("dark");
    await vi.waitFor(() => expect(document.documentElement.dataset.theme).toMatch(/-dark$/));
    context.preferences.app.colorScheme.set("light");
    await vi.waitFor(() => expect(document.documentElement.dataset.theme).not.toMatch(/-dark$/));
  });

  test("hints start as their preference says, then follow it", () => {
    const context = createAppContext({ shell: new Shell(), preferences: { favorites: { hintsEnabled: true } } });

    setupStyles(context);
    expect(document.documentElement.dataset.tooltips).toBeDefined();
    context.preferences.favorites.hintsEnabled.set(false);
    expect(document.documentElement.dataset.tooltips).toBeUndefined();
  });
});
