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
const includeBackendLive = process.env.E2E_BACKEND_LIVE === "1";
const browserSuiteSpecs = [
  "tests/browser-e2e/marketplace-smoke.spec.cjs",
  "tests/browser-e2e/post-location-map.spec.cjs",
  "tests/browser-e2e/route-ux.spec.cjs",
];
const backendLiveSpec = "tests/browser-e2e/backend-live.spec.cjs";

if (projects.length === 0) {
  console.error("No Playwright projects selected.");
  process.exit(1);
}

if (includeBackendLive) {
  console.log(
    "Including backend-connected browser journey for the chromium project because E2E_BACKEND_LIVE=1.",
  );
} else {
  console.log(
    "Skipping backend-connected browser journey in the default browser suite. Set E2E_BACKEND_LIVE=1 or run npm run test:e2e:backend-live to include it.",
  );
}

const runEnv = {
  ...process.env,
  PW_REUSE_EXISTING_SERVER: process.env.PW_REUSE_EXISTING_SERVER || "0",
};
const runResults = [];

function runSuite(label, specPaths, selectedProjects) {
  const run = spawnSync(
    playwrightBin,
    [
      "test",
      ...specPaths,
      "--config=playwright.config.cjs",
      "--project",
      ...selectedProjects,
    ],
    {
      stdio: "inherit",
      env: runEnv,
    },
  );

  if (typeof run.status !== "number") {
    console.error(`Failed to execute Playwright suite: ${label}`);
    runResults.push({ label, status: 1 });
    return;
  }

  runResults.push({ label, status: run.status });
}

runSuite(
  `mocked browser journeys (${projects.join(", ")})`,
  browserSuiteSpecs,
  projects,
);

if (includeBackendLive) {
  if (projects.includes("chromium")) {
    runSuite("backend-connected journey (chromium)", [backendLiveSpec], [
      "chromium",
    ]);
  } else {
    console.warn(
      "E2E_BACKEND_LIVE=1 was set, but chromium is not in PW_PROJECTS; the backend-connected journey was not run.",
    );
  }
}

console.log("\nPlaywright suite summary:");
for (const result of runResults) {
  console.log(`${result.status === 0 ? "PASS" : "FAIL"} ${result.label}`);
}

process.exit(runResults.some((result) => result.status !== 0) ? 1 : 0);
