import { existsSync, readFileSync } from "fs";

export function buildDefine(scriptVersion: string): Record<string, string> {
  const env = Object.fromEntries(Object.entries(loadEnvironment()).map(([key, value]) => [key, JSON.stringify(value === "true")]));
  return { ...env, SCRIPT_VERSION: JSON.stringify(scriptVersion) };
}

function loadEnvironment(): Record<string, string> {
  const file = existsSync(".env") ? ".env" : ".env.example";
  const entries = readFileSync(file, "utf8").split("\n").filter(line => line.includes("="));
  return Object.fromEntries(entries.map(line => line.trim().split("=")));
}
