import { LightboxSession, LightboxSessionPart } from "@/core/features/lightbox/ui/screen/session";
import { describe, expect, test } from "vitest";
import { Signal } from "@/core/utils/reactive/signal";
import { doNothing } from "@/core/utils/function/function";

interface Setup {
  session: LightboxSession;
  isOpen: Signal<boolean>;
  calls: string[];
}

function createPart(name: string, calls: string[]): LightboxSessionPart {
  return { start: () => calls.push(`start ${name}`), stop: () => calls.push(`stop ${name}`) };
}

function setup(isInitiallyOpen = false): Setup {
  const isOpen = new Signal(isInitiallyOpen);
  const calls: string[] = [];
  const session = new LightboxSession({ isOpen, parts: [createPart("a", calls), createPart("b", calls)] });
  return { session, isOpen, calls };
}

describe("LightboxSession", () => {
  test("starts every part on open and stops them on close", () => {
    const { isOpen, calls } = setup();

    isOpen.value = true;
    isOpen.value = false;
    expect(calls).toEqual(["start a", "start b", "stop a", "stop b"]);
  });

  test("starts at once when created open", () => {
    expect(setup(true).calls).toEqual(["start a", "start b"]);
  });

  test("doesn't track signals its parts read", () => {
    const isOpen = new Signal(false);
    const read = new Signal(0);
    const starts: number[] = [];
    const part: LightboxSessionPart = { start: () => starts.push(read.value), stop: doNothing };

    new LightboxSession({ isOpen, parts: [part] });
    isOpen.value = true;
    read.value = 1;
    expect(starts).toEqual([0]);
  });

  describe("dispose", () => {
    test("stops the parts if they're running, and follows the open state no more", () => {
      const { session, isOpen, calls } = setup(true);

      session.dispose();
      session.dispose();
      isOpen.value = false;
      isOpen.value = true;
      expect(calls).toEqual(["start a", "start b", "stop a", "stop b"]);
    });
  });
});
