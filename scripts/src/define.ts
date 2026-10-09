import { existsSync, readFileSync } from "fs";

export function buildDefine(scriptVersion: string, defaults: Record<string, string>): Record<string, string> {
  const values = { ...defaults, ...loadEnvironment() };
  const env = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, JSON.stringify(parseValue(value))]));
  return { ...env, SCRIPT_VERSION: JSON.stringify(scriptVersion) };
}

function loadEnvironment(): Record<string, string> {
  const file = existsSync(".env") ? ".env" : ".env.example";
  const entries = readFileSync(file, "utf8").split("\n").filter(line => line.includes("="));
  return Object.fromEntries(entries.map(line => line.trim().split("=")).filter(([, value]) => value !== ""));
}

function parseValue(value: string): boolean | string {
  const lowered = value.toLowerCase();
  return lowered === "true" || lowered === "false" ? lowered === "true" : value;
}
