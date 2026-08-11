import { execFileSync } from "child_process";

function describe(args: string[]): string {
  return execFileSync("git", ["describe", "--tags", ...args], { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim()
    .replace(/^v/, "");
}

export function resolveScriptVersion(): string {
  try {
    return describe(["--exact-match"]);
  } catch {
    try {
      return describe([]);
    } catch {
      return "0.0.0-dev";
    }
  }
}
