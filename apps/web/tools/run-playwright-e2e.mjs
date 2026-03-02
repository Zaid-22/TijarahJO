import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const playwrightBin = resolve(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "playwright.cmd" : "playwright",
);

if (!existsSync(playwrightBin)) {
  console.error(
    "Browser E2E is not installed. Add @playwright/test to devDependencies, then run: npx playwright install --with-deps",
  );
  process.exit(1);
}

const projects = (process.env.PW_PROJECTS || "chromium,tablet,mobile")
  .split(",")
  .map((entry) => entry.trim())
  .filter((entry) => entry.length > 0);

if (projects.length === 0) {
  console.error("No Playwright projects selected.");
  process.exit(1);
}

for (const project of projects) {
  const runEnv = {
    ...process.env,
    PW_REUSE_EXISTING_SERVER:
      process.env.PW_REUSE_EXISTING_SERVER || "0",
  };

  const run = spawnSync(
    playwrightBin,
    ["test", "--config=playwright.config.cjs", "--project", project],
    {
      stdio: "inherit",
      env: runEnv,
    },
  );

  if (typeof run.status !== "number") {
    console.error(`Failed to execute Playwright for project: ${project}`);
    process.exit(1);
  }

  if (run.status !== 0) {
    process.exit(run.status);
  }
}

process.exit(0);
