import { describe, expect, test } from "vitest";
import { createEnvironment } from "@/testing/environment";
import { selectPreferenceDefaults } from "@/app/context/preference_defaults";

describe("selectPreferenceDefaults", () => {
  test("gives a hover pointer more columns and hover-only hints", () => {
    expect(selectPreferenceDefaults(createEnvironment({ pointer: "hover" })))
      .toMatchObject({ favoritesColumnCount: 5, favoritesHintsEnabled: true, galleryMenuEnabled: false });
  });

  test("gives a touch pointer fewer columns and the gallery menu", () => {
    expect(selectPreferenceDefaults(createEnvironment({ pointer: "touch" })))
      .toMatchObject({ favoritesColumnCount: 2, favoritesHintsEnabled: false, galleryMenuEnabled: true });
  });

  test("starts in the host's color scheme", () => {
    expect(selectPreferenceDefaults(createEnvironment({ colorScheme: "dark" })).colorScheme).toBe("dark");
  });
});
