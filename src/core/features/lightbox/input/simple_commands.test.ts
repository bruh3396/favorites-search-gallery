import { LightboxCommand, LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";
import { Mock, describe, expect, test, vi } from "vitest";
import { Signal } from "@/core/utils/reactive/signal";
import { limitToSimpleCommands } from "@/core/features/lightbox/input/simple_commands";

const COMMANDS: readonly LightboxCommand[] = [
  "showNext", "showPrevious", "toggleAutoplay", "togglePause", "toggleMute", "toggleFullscreen", "toggleZoom", "toggleDetails",
  "dismiss", "download", "openPostPage", "openOriginal", "close"
];

function setup(): { handlers: Record<LightboxCommand, Mock<() => void>>; limited: LightboxCommandHandlers; simple: Signal<boolean> } {
  const handlers = Object.fromEntries(COMMANDS.map(command => [command, vi.fn<() => void>()])) as Record<LightboxCommand, Mock<() => void>>;
  const simple = new Signal(true);
  return { handlers, limited: limitToSimpleCommands(handlers, simple), simple };
}

function runAll(handlers: LightboxCommandHandlers): void {
  COMMANDS.forEach(command => handlers[command]());
}

describe("limitToSimpleCommands", () => {
  test("runs only stepping, pausing, closing and opening the post or original in simple mode", () => {
    const { handlers, limited } = setup();

    runAll(limited);
    expect(COMMANDS.filter(command => handlers[command].mock.calls.length > 0))
      .toEqual(["showNext", "showPrevious", "togglePause", "dismiss", "openPostPage", "openOriginal", "close"]);
  });

  test("runs every command outside simple mode", () => {
    const { handlers, limited, simple } = setup();

    simple.value = false;
    runAll(limited);
    expect(COMMANDS.every(command => handlers[command].mock.calls.length === 1)).toBe(true);
  });
});
