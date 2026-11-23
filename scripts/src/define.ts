import { existsSync, readFileSync } from "fs";

const ENVIRONMENT_FILE = ".env";
const SHARED_DEFAULTS: Record<string, string> = { USE_LOCAL_SERVER: "false" };

export function buildDefine(scriptVersion: string, defaults: Record<string, string>): Record<string, string> {
  const values = { ...SHARED_DEFAULTS, ...defaults, ...loadEnvironment() };
  const env = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, JSON.stringify(parseValue(value))]));
  return { ...env, SCRIPT_VERSION: JSON.stringify(scriptVersion) };
}

function loadEnvironment(): Record<string, string> {
  if (!existsSync(ENVIRONMENT_FILE)) {
    return {};
  }
  const entries = readFileSync(ENVIRONMENT_FILE, "utf8").split("\n").filter(line => line.includes("="));
  return Object.fromEntries(entries.map(line => line.trim().split("=")).filter(([, value]) => value !== ""));
}

function parseValue(value: string): boolean | string {
  const lowered = value.toLowerCase();
  return lowered === "true" || lowered === "false" ? lowered === "true" : value;
}
