import { describe, expect, test, vi } from "vitest";
import { LightboxActions } from "@/core/features/lightbox/actions/actions";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryFileSaver } from "@/adapters/memory/ports/file_saver/file_saver";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/navigator";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";
import { flushMicrotasks } from "@/testing/async";

const POST: MediaItem = { id: "1", media: { kind: "image", locator: "https://originals/1.png" } };

interface Setup {
  actions: LightboxActions;
  navigator: MemoryNavigator;
  fileSaver: MemoryFileSaver;
}

function setup(remoteMedia = new MemoryRemoteMedia()): Setup {
  const navigator = new MemoryNavigator();
  const fileSaver = new MemoryFileSaver();
  return { actions: new LightboxActions({ remoteMedia, remotePages: new MemoryRemotePages(), navigator, fileSaver }), navigator, fileSaver };
}

describe("LightboxActions", () => {
  describe("openOriginal", () => {
    test("opens the item's original", async() => {
      const { actions, navigator } = setup();

      actions.openOriginal(POST);
      await flushMicrotasks();
      expect(navigator.opened).toEqual(["https://originals/1.png"]);
    });
  });

  describe("openPostPage", () => {
    test("opens the item's post page", () => {
      const { actions, navigator } = setup();

      actions.openPostPage(POST);
      expect(navigator.opened).toEqual(["#post-1"]);
    });
  });

  describe("download", () => {
    test("saves the original named by the item's id and its subtype", async() => {
      const remoteMedia = new MemoryRemoteMedia();

      vi.spyOn(remoteMedia, "fetchOriginal").mockResolvedValue(new Blob([], { type: "image/png" }));
      const { actions, fileSaver } = setup(remoteMedia);

      actions.download(POST);
      await flushMicrotasks();
      expect(fileSaver.saved.map(saved => saved.name)).toEqual(["1.png"]);
    });

    test("names the original by the item's id alone when its type is unknown", async() => {
      const { actions, fileSaver } = setup();

      actions.download(POST);
      await flushMicrotasks();
      expect(fileSaver.saved.map(saved => saved.name)).toEqual(["1"]);
    });

    test("opens the original instead when fetching it fails", async() => {
      const remoteMedia = new MemoryRemoteMedia();

      vi.spyOn(remoteMedia, "fetchOriginal").mockRejectedValue(new Error("blocked"));
      const { actions, navigator, fileSaver } = setup(remoteMedia);

      actions.download(POST);
      await flushMicrotasks();
      expect([fileSaver.saved, navigator.opened]).toEqual([[], ["https://originals/1.png"]]);
    });
  });
});
