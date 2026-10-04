import { describe, expect, test } from "vitest";
import { indexSettings, matchSettings, splitQuery } from "@/core/ui/settings/search";
import { SettingDescriptor } from "@/core/ui/settings/descriptor";

const PREFERENCE = { value: false, set: (): void => undefined };

const DESCRIPTORS: SettingDescriptor[] = [
  { id: "hints", kind: "switch", label: "Hints", description: "Show a caption under each setting.", preference: PREFERENCE },
  { id: "autoplay", kind: "switch", label: "Autoplay", keywords: ["video"], preference: PREFERENCE },
  {
    id: "layout", kind: "choice", label: "Layout", variant: "segmented", members: ["column", "row"], labels: { column: "Column", row: "Row" },
    preference: { value: "column", set: (): void => undefined }
  }
];

const INDEX = indexSettings([
  { title: "General", descriptors: DESCRIPTORS.slice(0, 2) },
  { title: "Thumbnails", descriptors: DESCRIPTORS.slice(2) }
]);

function searchSettings(query: string): string[] {
  return [...matchSettings(INDEX, splitQuery(query))];
}

describe("splitQuery", () => {
  test("lowercases the query and splits it on whitespace, dropping empty terms", () => {
    expect(splitQuery("  Auto\tPLAY  video ")).toEqual(["auto", "play", "video"]);
    expect(splitQuery("   ")).toEqual([]);
  });
});

describe("matchSettings", () => {
  test("matches every setting when there are no terms", () => {
    expect(searchSettings("")).toEqual(["hints", "autoplay", "layout"]);
  });

  test("matches a setting by any part of its label, description, keywords, section title, or choice labels", () => {
    expect(searchSettings("int")).toEqual(["hints"]);
    expect(searchSettings("caption")).toEqual(["hints"]);
    expect(searchSettings("video")).toEqual(["autoplay"]);
    expect(searchSettings("general")).toEqual(["hints", "autoplay"]);
    expect(searchSettings("column")).toEqual(["layout"]);
  });

  test("ignores case", () => {
    expect(searchSettings("AUTOPLAY")).toEqual(["autoplay"]);
  });

  test("requires every term to match", () => {
    expect(searchSettings("general video")).toEqual(["autoplay"]);
    expect(searchSettings("thumbnails video")).toEqual([]);
  });

  test("never matches a term across two fields", () => {
    expect(searchSettings("generalhints")).toEqual([]);
  });
});
