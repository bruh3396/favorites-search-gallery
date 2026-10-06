import { describe, expect, test } from "vitest";
import { AppRootClass } from "@/core/ui/app_root/app_root";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { PostGridSkeletonClass } from "@/core/ui/post_grid/skeleton";
import { mountPostListPage } from "@/core/app/post_list_page";

describe("mountPostListPage", () => {
  test("mounts the skeleton and the post grid in the app root inside the container", () => {
    const container = document.createElement("div");

    mountPostListPage(container, { colorScheme: "light" }, { remoteMedia: new MemoryRemoteMedia(), localKeyedValues: new MemoryLocalKeyedValues() });
    const app = container.shadowRoot!.querySelector<HTMLElement>(`.${AppRootClass.root}`)!;

    expect([...app.children].map(child => child.classList.contains(PostGridSkeletonClass.root))).toEqual([true, false]);
    expect([...app.children].every(child => child.classList.contains(PostGridClass.root))).toBe(true);
  });

  test("lays the grid out in the layout kept in the app's preferences", () => {
    const container = document.createElement("div");
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery", { preferences: { postGridLayout: "row" } });
    mountPostListPage(container, { colorScheme: "light" }, { remoteMedia: new MemoryRemoteMedia(), localKeyedValues });
    expect(container.shadowRoot!.querySelector<HTMLElement>(`.${PostGridClass.root}`)!.dataset.layout).toBe("row");
  });
});
