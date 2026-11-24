import { describe, expect, test } from "vitest";
import { LIGHTBOX_COMMAND_DEFINITIONS } from "@/core/features/lightbox/commands/lightbox_command";
import { LIGHTBOX_COMMAND_SECTION } from "@/core/app/favorites/key_bindings/lightbox_command_section";

describe("LIGHTBOX_COMMAND_SECTION", () => {
  test("lists every command exactly once", () => {
    expect([...LIGHTBOX_COMMAND_SECTION.lightboxCommands].sort()).toEqual(Object.keys(LIGHTBOX_COMMAND_DEFINITIONS).sort());
  });
});
