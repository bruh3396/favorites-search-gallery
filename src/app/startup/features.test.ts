import { describe, expect, test } from "vitest";
import { Environment } from "@/core/boundary/environment";
import { Feature } from "@/core/context/features";
import { PerformanceProfile } from "@/types/app";
import { createEnvironment } from "@/testing/environment";
import { selectFeatures } from "@/app/startup/features";

function featuresFor(environment: Partial<Environment>, profile: PerformanceProfile = "normal"): Feature[] {
  return Array.from(selectFeatures(createEnvironment(environment), profile));
}

describe("selectFeatures", () => {
  test("on desktop favorites, everything but the post list navigator runs, producers first", () => {
    expect(featuresFor({ mode: "favorites", device: "desktop" })).toEqual(["favorites", "gallery", "tooltip", "postOverlay"]);
  });

  test("on desktop post lists, the navigator replaces the post overlay", () => {
    expect(featuresFor({ mode: "posts", device: "desktop" })).toEqual(["favorites", "postListNavigator", "gallery", "tooltip"]);
  });

  test("on mobile, hover features don't run", () => {
    expect(featuresFor({ mode: "favorites", device: "mobile" })).toEqual(["favorites", "gallery"]);
  });

  test.each<[PerformanceProfile, Feature[]]>([
    ["low", ["favorites", "tooltip", "postOverlay"]],
    ["potato", ["favorites"]]
  ])("the %s profile sheds features", (profile, expected) => {
    expect(featuresFor({ mode: "favorites", device: "desktop" }, profile)).toEqual(expected);
  });
});
