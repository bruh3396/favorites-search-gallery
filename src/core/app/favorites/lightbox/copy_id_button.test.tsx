import { CopyIdButton, CopyIdButtonClass } from "@/core/app/favorites/lightbox/copy_id_button";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { MemoryClipboard } from "@/adapters/memory/ports/clipboard/memory_clipboard";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { flushMicrotasks } from "@/testing/async";

interface Setup {
  id: Signal<string | undefined>;
  clipboard: MemoryClipboard;
  scheduler: MemoryScheduler;
  button: HTMLButtonElement;
  readId: () => string;
  isCopiedShown: () => boolean;
}

function setup(initial: string | undefined): Setup {
  const id = new Signal<string | undefined>(initial);
  const clipboard = new MemoryClipboard();
  const scheduler = new MemoryScheduler();
  const { result: button } = render(document, () => <CopyIdButton id={id} clipboard={clipboard} scheduler={scheduler} copiedDuration={1_500} /> as HTMLButtonElement);
  const readId = (): string => button.firstChild?.textContent ?? "";
  const isCopiedShown = (): boolean => !button.querySelector<HTMLElement>(`.${CopyIdButtonClass.copied}`)!.hidden;
  return { id, clipboard, scheduler, button, readId, isCopiedShown };
}

describe("CopyIdButton", () => {
  test("shows the id and follows it", () => {
    const { id, readId } = setup("12");

    expect(readId()).toBe("12");
    id.value = "34";
    expect(readId()).toBe("34");
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
    const { id, button, isCopiedShown } = setup("12");

    button.click();
    await flushMicrotasks();
    id.value = "34";
    expect(isCopiedShown()).toBe(false);
  });

  test("copies nothing without an id", async() => {
    const { clipboard, button, readId, isCopiedShown } = setup(undefined);

    button.click();
    await flushMicrotasks();
    expect([readId(), clipboard.text, isCopiedShown()]).toEqual(["", "", false]);
  });
});
