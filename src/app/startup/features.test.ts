import { describe, expect, test } from "vitest";
import { Environment } from "@/core/boundary/environment";
import { Feature } from "@/core/context/features";
import { PerformanceProfile } from "@/types/app";
import { createEnvironment } from "@/testing/environment";
import { selectFeatures } from "@/app/startup/features";

function listSelectedFeatures(environment: Partial<Environment>, profile: PerformanceProfile = "normal"): Feature[] {
  return [...selectFeatures(createEnvironment(environment), profile)];
}

describe("selectFeatures", () => {
  test("runs everything but the post list navigator on desktop favorites, producers first", () => {
    expect(listSelectedFeatures({ mode: "favorites", device: "desktop" })).toEqual(["favorites", "gallery", "tooltip", "postOverlay"]);
  });

  test("runs the navigator in place of the post overlay on desktop post lists", () => {
    expect(listSelectedFeatures({ mode: "postList", device: "desktop" })).toEqual(["favorites", "postListNavigator", "gallery", "tooltip"]);
  });

  test("leaves out hover features on mobile", () => {
    expect(listSelectedFeatures({ mode: "favorites", device: "mobile" })).toEqual(["favorites", "gallery"]);
  });

  test.each<[PerformanceProfile, Feature[]]>([
    ["low", ["favorites", "tooltip", "postOverlay"]],
    ["potato", ["favorites"]]
  ])("the %s profile sheds features", (profile, expected) => {
    expect(listSelectedFeatures({ mode: "favorites", device: "desktop" }, profile)).toEqual(expected);
  });
});
