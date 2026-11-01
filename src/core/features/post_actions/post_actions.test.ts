import { describe, expect, test, vi } from "vitest";
import { PostActions } from "@/core/features/post_actions/post_actions";
import { createPost } from "@/testing/post";
import { doNothing } from "@/core/utils/function/function_utilities";
import { flushMicrotasks } from "@/testing/microtask_utilities";

const POST = createPost({ id: "42", media: { kind: "video", locator: "42" } });

function setup(fetchOriginal: () => Promise<Blob> = () => Promise.resolve(new Blob([], { type: "video/mp4" }))): {
  postActions: PostActions;
  opened: string[];
  saved: { file: Blob; name: string }[];
} {
  const opened: string[] = [];
  const saved: { file: Blob; name: string }[] = [];
  const postActions = new PostActions({
    remoteMedia: { resolveOriginalUrl: (media): Promise<string> => Promise.resolve(`original/${media.locator}`), fetchOriginal },
    remotePages: { postUrl: (postId): string => `post/${postId}` },
    navigator: { open: (url): number => opened.push(url) },
    fileSaver: { save: (file, name): number => saved.push({ file, name }) }
  });
  return { postActions, opened, saved };
}

describe("PostActions", () => {
  describe("openPostPage", () => {
    test("opens the post's page", () => {
      const { postActions, opened } = setup();

      postActions.openPostPage(POST);
      expect(opened).toEqual(["post/42"]);
    });
  });

  describe("openOriginal", () => {
    test("opens the post's original file", async() => {
      const { postActions, opened } = setup();

      postActions.openOriginal(POST);
      await flushMicrotasks();
      expect(opened).toEqual(["original/42"]);
    });

    test("logs a url that can't be resolved", async() => {
      const logError = vi.spyOn(console, "error").mockImplementation(doNothing);
      const opened: string[] = [];
      const postActions = new PostActions({
        remoteMedia: {
          resolveOriginalUrl: (): Promise<never> => Promise.reject(new Error("gone")),
          fetchOriginal: (): Promise<never> => Promise.reject(new Error("gone"))
        },
        remotePages: { postUrl: (postId): string => postId },
        navigator: { open: (url): number => opened.push(url) },
        fileSaver: { save: doNothing }
      });

      postActions.openOriginal(POST);
      await flushMicrotasks();
      expect(opened).toEqual([]);
      expect(logError).toHaveBeenCalledOnce();
      logError.mockRestore();
    });
  });

  describe("download", () => {
    test("saves the original named by the post id and file type", async() => {
      const { postActions, saved } = setup();

      postActions.download(POST);
      await flushMicrotasks();
      expect(saved.map(file => file.name)).toEqual(["42.mp4"]);
    });

    test("names a file with no type by the post id alone", async() => {
      const { postActions, saved } = setup(() => Promise.resolve(new Blob([])));

      postActions.download(POST);
      await flushMicrotasks();
      expect(saved.map(file => file.name)).toEqual(["42"]);
    });

    test("opens the original instead when it can't be fetched", async() => {
      const { postActions, opened, saved } = setup(() => Promise.reject(new Error("blocked")));

      postActions.download(POST);
      await flushMicrotasks();
      expect(saved).toEqual([]);
      expect(opened).toEqual(["original/42"]);
    });
  });
});
