function featureLayer(type, path, options = {}) {
  return { type, pattern: [`src/features/*/${path}`, `src/core/features/*/${path}`], capture: ["feature"], ...options };
}

export const LAYERS = [
  { type: "testing", pattern: ["src/**/testing"] },
  featureLayer("features/features", "features/*", { capture: ["feature", "subFeature"] }),
  featureLayer("features/features/facade", "features"),
  featureLayer("features/control", "control"),
  featureLayer("features/flows", "flows"),
  featureLayer("features/model", "model"),
  featureLayer("features/shell", "shell"),
  featureLayer("features/types", "types"),
  featureLayer("features/view", "view"),
  { type: "features/root", pattern: ["src/features/*", "src/core/features/*"], capture: ["feature"] },
  { type: "core/domain", pattern: ["src/core/domain"] },
  { type: "core/boundary/ports", pattern: ["src/core/boundary/ports"] },
  { type: "core/boundary", pattern: ["src/core/boundary"] },
  { type: "core/context", pattern: ["src/core/context"] },
  { type: "core/ui", pattern: ["src/core/ui"] },
  { type: "core/utils", pattern: ["src/core/utils"] },
  { type: "adapters/client", pattern: ["src/adapters/*/client"], capture: ["name"] },
  { type: "adapters/environment", pattern: ["src/adapters/*/environment"], capture: ["name"] },
  { type: "adapters/ports", pattern: ["src/adapters/*/ports/*"], capture: ["name", "port"] },
  { type: "targets", pattern: ["src/targets"] },
  { type: "legacy", pattern: ["src/lib", "src/app", "src/config", "src/types", "src/assets", "src/utils"] }
];
