import { describe, expect, test, vi } from "vitest";
import { PostActions } from "@/core/app/post_actions";
import { createPost } from "@/testing/post";
import { doNothing } from "@/core/utils/function/function";
import { flushMicrotasks } from "@/testing/async";

const POST = createPost({ id: "42", media: { kind: "video", locator: "42" } });

function setup(fetchOriginal: () => Promise<Blob> = () => Promise.resolve(new Blob([], { type: "video/mp4" }))): {
  actions: PostActions;
  opened: string[];
  saved: { file: Blob; name: string }[];
} {
  const opened: string[] = [];
  const saved: { file: Blob; name: string }[] = [];
  const actions = new PostActions({
    remoteMedia: { resolveOriginalUrl: media => Promise.resolve(`original/${media.locator}`), fetchOriginal },
    remotePages: { postUrl: id => `post/${id}` },
    navigator: { open: url => opened.push(url) },
    fileSaver: { save: (file, name) => saved.push({ file, name }) }
  });
  return { actions, opened, saved };
}

describe("PostActions", () => {
  describe("openPostPage", () => {
    test("opens the post's page", () => {
      const { actions, opened } = setup();

      actions.openPostPage(POST);
      expect(opened).toEqual(["post/42"]);
    });
  });

  describe("openOriginal", () => {
    test("opens the post's original file", async() => {
      const { actions, opened } = setup();

      actions.openOriginal(POST);
      await flushMicrotasks();
      expect(opened).toEqual(["original/42"]);
    });

    test("logs a url that can't be resolved", async() => {
      const logError = vi.spyOn(console, "error").mockImplementation(doNothing);
      const opened: string[] = [];
      const actions = new PostActions({
        remoteMedia: { resolveOriginalUrl: () => Promise.reject(new Error("gone")), fetchOriginal: () => Promise.reject(new Error("gone")) },
        remotePages: { postUrl: id => id },
        navigator: { open: url => opened.push(url) },
        fileSaver: { save: doNothing }
      });

      actions.openOriginal(POST);
      await flushMicrotasks();
      expect(opened).toEqual([]);
      expect(logError).toHaveBeenCalledOnce();
      logError.mockRestore();
    });
  });

  describe("download", () => {
    test("saves the original named by the post id and file type", async() => {
      const { actions, saved } = setup();

      actions.download(POST);
      await flushMicrotasks();
      expect(saved.map(file => file.name)).toEqual(["42.mp4"]);
    });

    test("names a file with no type by the post id alone", async() => {
      const { actions, saved } = setup(() => Promise.resolve(new Blob([])));

      actions.download(POST);
      await flushMicrotasks();
      expect(saved.map(file => file.name)).toEqual(["42"]);
    });

    test("opens the original instead when it can't be fetched", async() => {
      const { actions, opened, saved } = setup(() => Promise.reject(new Error("blocked")));

      actions.download(POST);
      await flushMicrotasks();
      expect(saved).toEqual([]);
      expect(opened).toEqual(["original/42"]);
    });
  });
});
