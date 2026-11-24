import { describe, expect, test } from "vitest";
import { FAVORITES_COMMAND_DEFINITIONS } from "@/core/app/favorites/commands/favorites_command";
import { FAVORITES_COMMAND_SECTIONS } from "@/core/app/favorites/key_bindings/favorites_command_sections";

describe("FAVORITES_COMMAND_SECTIONS", () => {
  test("lists every command exactly once", () => {
    const listedCommands = FAVORITES_COMMAND_SECTIONS.flatMap(({ favoritesCommands }) => favoritesCommands);

    expect([...listedCommands].sort()).toEqual(Object.keys(FAVORITES_COMMAND_DEFINITIONS).sort());
  });
});
