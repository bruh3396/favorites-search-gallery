import { execFileSync } from "child_process";

function describe(args: string[]): string {
  return execFileSync("git", ["describe", "--tags", "--match", "v*", ...args], { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim()
    .replace(/^v/, "");
}

export function resolveScriptVersion(): string {
  try {
    return describe(["--exact-match"]);
  } catch {
    try {
      return `${describe([]).split("-")[0]}-dev`;
    } catch {
      return "0.0.0-dev";
    }
  }
}
