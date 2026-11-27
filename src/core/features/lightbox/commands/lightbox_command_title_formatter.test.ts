import { LIGHTBOX_COMMAND_DEFINITIONS, LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { describe, expect, test } from "vitest";
import { createKeyBindings } from "@/testing/key_bindings";
import { formatLightboxCommandTitle } from "@/core/features/lightbox/commands/lightbox_command_title_formatter";

const LIGHTBOX_COMMANDS = Object.keys(LIGHTBOX_COMMAND_DEFINITIONS) as LightboxCommand[];

describe("formatLightboxCommandTitle", () => {
  test("titles a command with its own label and first key", () => {
    expect(formatLightboxCommandTitle("showNext", createKeyBindings(LIGHTBOX_COMMANDS, { showNext: ["ArrowRight", "n"] }))).toBe("Go to Next (→)");
  });

  test("titles a command with a given label", () => {
    const lightboxKeyBindings = createKeyBindings(LIGHTBOX_COMMANDS, { toggleFullscreen: ["f"] });

    expect(formatLightboxCommandTitle("toggleFullscreen", lightboxKeyBindings, "Fullscreen")).toBe("Fullscreen (F)");
  });

  test("leaves out the key of an unbound command", () => {
    expect(formatLightboxCommandTitle("close", createKeyBindings(LIGHTBOX_COMMANDS))).toBe("Close");
  });
});
