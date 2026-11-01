import { CopyIdButton, CopyIdButtonClass } from "@/core/app/favorites/lightbox/copy_id_button";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { MemoryClipboard } from "@/adapters/memory/ports/clipboard/memory_clipboard";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { flushMicrotasks } from "@/testing/microtask_utilities";

interface Setup {
  postId: Signal<string | undefined>;
  clipboard: MemoryClipboard;
  scheduler: MemoryScheduler;
  button: HTMLButtonElement;
  readPostId: () => string;
  isCopiedShown: () => boolean;
}

function setup(initial: string | undefined): Setup {
  const postId = new Signal<string | undefined>(initial);
  const clipboard = new MemoryClipboard();
  const scheduler = new MemoryScheduler();
  const { result: button } = render(
    document,
    () => <CopyIdButton postId={postId} clipboard={clipboard} scheduler={scheduler} copiedDuration={1_500} /> as HTMLButtonElement
  );
  const readPostId = (): string => button.firstChild?.textContent ?? "";
  const isCopiedShown = (): boolean => !button.querySelector<HTMLElement>(`.${CopyIdButtonClass.copied}`)!.hidden;
  return { postId, clipboard, scheduler, button, readPostId, isCopiedShown };
}

describe("CopyIdButton", () => {
  test("shows the id and follows it", () => {
    const { postId, readPostId } = setup("12");

    expect(readPostId()).toBe("12");
    postId.value = "34";
    expect(readPostId()).toBe("34");
  });

  test("copies the id and confirms it briefly", async() => {
    const { clipboard, scheduler, button, isCopiedShown } = setup("12");

    button.click();
    await flushMicrotasks();
    expect([clipboard.text, isCopiedShown()]).toEqual(["12", true]);
    scheduler.advance(1_500);
    expect(isCopiedShown()).toBe(false);
  });

  test("drops the confirmation when the id changes", async() => {
    const { postId, button, isCopiedShown } = setup("12");

    button.click();
    await flushMicrotasks();
    postId.value = "34";
    expect(isCopiedShown()).toBe(false);
  });

  test("cancels a pending confirmation reset once disposed", async() => {
    const postId = new Signal<string | undefined>("12");
    const cancelReset = vi.fn();
    const scheduler = { schedule: vi.fn(() => cancelReset) };
    const { result: button, dispose } = render(
      document,
      () => <CopyIdButton postId={postId} clipboard={new MemoryClipboard()} scheduler={scheduler} copiedDuration={1_500} />
    );

    button.click();
    await flushMicrotasks();
    dispose();
    expect(cancelReset).toHaveBeenCalledOnce();
  });

  test("copies nothing without an id", async() => {
    const { clipboard, button, readPostId, isCopiedShown } = setup(undefined);

    button.click();
    await flushMicrotasks();
    expect([readPostId(), clipboard.text, isCopiedShown()]).toEqual(["", "", false]);
  });
});
