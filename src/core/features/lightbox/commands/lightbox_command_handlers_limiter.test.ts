import { LIGHTBOX_COMMAND_DEFINITIONS, LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { describe, expect, test, vi } from "vitest";
import { CommandHandlers } from "@/core/ui/key_bindings/command_handlers";
import { Signal } from "@/core/utils/reactive/signal";
import { limitLightboxCommandHandlers } from "@/core/features/lightbox/commands/lightbox_command_handlers_limiter";

const LIGHTBOX_COMMANDS = Object.keys(LIGHTBOX_COMMAND_DEFINITIONS) as LightboxCommand[];
const SIMPLE_COMMANDS: readonly LightboxCommand[] = [
  "showNext",
  "showPrevious",
  "togglePause",
  "toggleMute",
  "toggleFullscreen",
  "addFavorite",
  "openPostPage",
  "openOriginal",
  "dismiss",
  "close"
];

function setup(simple: Signal<boolean>): { listRunCommands: () => LightboxCommand[] } {
  const runCommands: LightboxCommand[] = [];
  const handlers = Object.fromEntries(LIGHTBOX_COMMANDS.map(lightboxCommand => [lightboxCommand, vi.fn(() => runCommands.push(lightboxCommand))]));
  const limitedHandlers = limitLightboxCommandHandlers(handlers as unknown as CommandHandlers<LightboxCommand>, simple);
  return {
    listRunCommands: (): LightboxCommand[] => {
      LIGHTBOX_COMMANDS.forEach(lightboxCommand => limitedHandlers[lightboxCommand]());
      return runCommands;
    }
  };
}

describe("limitLightboxCommandHandlers", () => {
  test("runs every command outside simple mode", () => {
    expect(setup(new Signal(false)).listRunCommands()).toEqual(LIGHTBOX_COMMANDS);
  });

  test("runs only stepping, playback, fullscreen, closing, opening and favoriting in simple mode", () => {
    expect(setup(new Signal(true)).listRunCommands()).toEqual(SIMPLE_COMMANDS);
  });

  test("reads the mode when a command runs", () => {
    const simple = new Signal(false);
    const { listRunCommands } = setup(simple);

    simple.value = true;
    expect(listRunCommands()).not.toContain("download");
  });
});
