export const SAME_FEATURE = { feature: "{{ from.element.captured.feature }}" };
export const FEATURE_ENTRY = { type: "features/root", fileInternalPath: ["{{ from.element.captured.feature }}.ts", "{{ from.element.captured.feature }}.test.ts"] };
export const CORE_FEATURES = { type: "features/**", path: "**/src/core/features/**" };
export const LEGACY_FEATURES = { type: "features/**", path: "**/src/features/**" };
export const OUTSIDE_NEW_CODE = { type: "!{core/**,adapters/**,targets}" };
export const OLD_CODE = [{ type: "!{core/**,adapters/**,targets,features/**}" }, LEGACY_FEATURES];
