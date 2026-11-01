import { describe, expect, test } from "vitest";
import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { SettingsIndex } from "@/core/ui/settings/settings_index";

const PREFERENCE = { value: false, peek: (): boolean => false, set: (): void => undefined };

const DESCRIPTORS: SettingDescriptor[] = [
  { id: "hints", kind: "switch", label: "Hints", settingPreference: PREFERENCE },
  { id: "autoplay", kind: "switch", label: "Autoplay", keywords: ["video"], settingPreference: PREFERENCE },
  {
    id: "layout", kind: "choice", label: "Layout", control: "segmented", members: ["column", "row"], labels: { column: "Column", row: "Row" },
    settingPreference: { value: "column", peek: (): string => "column", set: (): void => undefined }
  }
];

const INDEX = new SettingsIndex([
  { title: "General", settingDescriptors: DESCRIPTORS.slice(0, 2) },
  { title: "Thumbnails", settingDescriptors: DESCRIPTORS.slice(2) }
]);

function searchSettings(query: string): string[] {
  return [...INDEX.match(query)];
}

describe("SettingsIndex", () => {
  describe("match", () => {
    test("matches every setting when the query is blank", () => {
      expect(searchSettings("")).toEqual(["hints", "autoplay", "layout"]);
      expect(searchSettings("   ")).toEqual(["hints", "autoplay", "layout"]);
    });

    test("matches a setting by any part of its label, keywords, section title, or choice labels", () => {
      expect(searchSettings("int")).toEqual(["hints"]);
      expect(searchSettings("video")).toEqual(["autoplay"]);
      expect(searchSettings("general")).toEqual(["hints", "autoplay"]);
      expect(searchSettings("column")).toEqual(["layout"]);
    });

    test("ignores case", () => {
      expect(searchSettings("AUTOPLAY")).toEqual(["autoplay"]);
    });

    test("requires every whitespace-separated term to match", () => {
      expect(searchSettings("general video")).toEqual(["autoplay"]);
      expect(searchSettings("  general\tVIDEO ")).toEqual(["autoplay"]);
      expect(searchSettings("thumbnails video")).toEqual([]);
    });

    test("never matches a term across two fields", () => {
      expect(searchSettings("generalhints")).toEqual([]);
    });
  });
});
