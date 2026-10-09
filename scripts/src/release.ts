import { execFileSync, spawnSync } from "child_process";
import { createInterface } from "readline/promises";

const BUMPS = ["patch", "minor", "major"] as const;
const TAG = /^v(\d+)\.(\d+)\.(\d+)$/;
const RELEASE_BRANCH = /^(main|release\/.+)$/;

type Bump = typeof BUMPS[number];

function git(...args: string[]): string {
  return execFileSync("git", args, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
}

function tryGit(...args: string[]): string | null {
  try {
    return git(...args);
  } catch {
    return null;
  }
}

function isWorkingTreeClean(): boolean {
  return git("status", "--porcelain") === "";
}

function readCurrentBranch(): string {
  return git("rev-parse", "--abbrev-ref", "HEAD");
}

function isInSyncWithRemote(branch: string): boolean {
  git("fetch", "origin", branch, "--tags");
  return git("rev-parse", "HEAD") === tryGit("rev-parse", `origin/${branch}`);
}

function readLastTag(): string | null {
  return tryGit("describe", "--tags", "--abbrev=0", "--match", "v*");
}

function tagExists(tag: string): boolean {
  return Boolean(tryGit("tag", "--list", tag));
}

function pushTag(tag: string): boolean {
  git("tag", tag);
  return tryGit("push", "origin", tag) !== null;
}

function fail(message: string): never {
  console.error(`FAILED: ${message}`);
  process.exit(1);
}

function bumpVersion(tag: string, bump: Bump): string {
  const match = TAG.exec(tag);

  if (match === null) {
    fail(`last tag '${tag}' is not in vMAJOR.MINOR.PATCH form`);
  }
  const [major, minor, patch] = match.slice(1).map(Number);

  if (bump === "major") {
    return `v${major + 1}.0.0`;
  }

  if (bump === "minor") {
    return `v${major}.${minor + 1}.0`;
  }
  return `v${major}.${minor}.${patch + 1}`;
}

async function confirm(question: string): Promise<boolean> {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await readline.question(question);

  readline.close();
  return answer.trim().toLowerCase() === "y";
}

function isReleaseBranch(branch: string): boolean {
  return RELEASE_BRANCH.test(branch);
}

function passesReleaseChecks(tag: string): boolean {
  const env = { ...process.env, RELEASE_VERSION: tag.replace(/^v/, "") };
  return spawnSync("npm", ["run", "release-checks:local"], { stdio: "inherit", shell: true, env }).status === 0;
}

function isBump(value: string | undefined): value is Bump {
  return BUMPS.includes(value as Bump);
}

async function release(): Promise<void> {
  const bump = process.argv[2];

  if (!isBump(bump)) {
    fail(`usage: release [${BUMPS.join("|")}]`);
  }

  if (!isWorkingTreeClean()) {
    fail("working tree is not clean, commit first");
  }
  const branch = readCurrentBranch();

  if (!isReleaseBranch(branch)) {
    fail(`not on main or a release/* branch (currently on ${branch})`);
  }

  if (!isInSyncWithRemote(branch)) {
    fail(`${branch} is not in sync with origin/${branch}, pull or push first`);
  }
  const last = readLastTag() ?? fail("no v* tag behind HEAD to bump from");
  const target = bumpVersion(last, bump);

  if (tagExists(target)) {
    fail(`tag ${target} already exists, delete it first`);
  }
  console.log(`\n  last tag:  ${last}\n  next:      ${target}\n`);

  if (!passesReleaseChecks(target)) {
    fail("npm run release-checks:local did not pass");
  }

  if (!(await confirm(`\nCreate and push tag ${target}? [y/N] `))) {
    console.log("aborted, no tag created");
    return;
  }

  if (!pushTag(target)) {
    fail(`could not push ${target}`);
  }
  console.log(`\npushed ${target}, watch the Actions tab, then upload the asset to Sleazyfork`);
}


release();
