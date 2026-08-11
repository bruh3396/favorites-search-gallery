import { execFileSync } from "child_process";

const FALLBACK_VERSION = "1.22";

export function resolveScriptVersion(): string {
  try {
    return execFileSync("git", ["describe", "--tags", "--exact-match"], { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
      .replace(/^v/, "");
  } catch {
    return `${FALLBACK_VERSION}-dev`;
  }
}
