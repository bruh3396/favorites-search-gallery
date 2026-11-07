import { spawn } from "child_process";

const CHECKS = ["test", "check:siblings", "typecheck", "lint", "check:conventions"];

function runCheck(check: string): Promise<boolean> {
  return new Promise(resolve => {
    const startTime = Date.now();
    const chunks: Buffer[] = [];
    const child = spawn("npm", ["run", "--silent", check], { stdio: ["ignore", "pipe", "pipe"], shell: true });

    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("close", exitCode => {
      const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
      const passed = exitCode === 0;

      console.log(`\n${passed ? "✔" : "✘"} ${check} (${seconds}s)`);
      process.stdout.write(Buffer.concat(chunks));
      resolve(passed);
    });
  });
}

async function runChecks(): Promise<void> {
  const results = await Promise.all(CHECKS.map(runCheck));
  const failed = CHECKS.filter((_, index) => !results[index]);

  console.log(failed.length === 0 ? "\n✔ all checks pass" : `\n✘ failed: ${failed.join(", ")}`);
  process.exitCode = failed.length === 0 ? 0 : 1;
}

void runChecks();
