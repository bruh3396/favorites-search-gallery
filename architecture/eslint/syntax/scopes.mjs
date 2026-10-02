export const LEGACY_MODEL = ["src/features/*/model/**/*.ts", "src/features/*/features/*/model/**/*.ts"];
export const CORE = ["src/core/**/*.ts", ...LEGACY_MODEL];
export const CORE_RENDERING = ["src/core/ui/**/*.ts", "src/core/features/*/view/**/*.ts", "src/core/features/*/features/*/view/**/*.ts"];
export const LEGACY_NO_DOM = ["src/features/*/*.ts", "src/features/*/{flows,types}/**/*.ts", "src/features/*/features/*/*.ts", "src/features/*/features/*/{flows,types}/**/*.ts"];
export const LEGACY_CONTROL = ["src/features/*/control/**/*.ts", "src/features/*/features/*/control/**/*.ts"];
export const TESTS = ["**/*.test.ts", "**/testing/**"];
export const FEATURES = ["src/core/**/*.ts", "src/features/**/*.ts"];
export const COMPOSITION_ROOTS = ["src/{core/,}features/*/*.ts", "src/{core/,}features/*/features/*/*.ts", "src/core/app/**"];
