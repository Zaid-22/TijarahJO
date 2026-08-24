import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const REQUIRED_STORY_FILES = [
  "stories/ui/Button.stories.tsx",
  "stories/ui/SubpageHeader.stories.tsx",
  "stories/ui/PostCard.stories.tsx",
];

function main() {
  const missingFiles = [];
  const malformedFiles = [];

  for (const relativePath of REQUIRED_STORY_FILES) {
    const absolutePath = path.resolve(process.cwd(), relativePath);
    if (!existsSync(absolutePath)) {
      missingFiles.push(relativePath);
      continue;
    }

    const content = readFileSync(absolutePath, "utf8");
    const hasDefaultExport = /\bexport\s+default\b/.test(content);
    const hasAtLeastOneStory = /\bexport\s+const\s+[A-Za-z0-9_]+\s*=/.test(
      content,
    );

    if (!hasDefaultExport || !hasAtLeastOneStory) {
      malformedFiles.push(relativePath);
    }
  }

  if (missingFiles.length > 0 || malformedFiles.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      "Storybook workflow check failed: required baseline stories are missing or malformed.",
    );

    for (const file of missingFiles) {
      // eslint-disable-next-line no-console
      console.error(`- missing: ${file}`);
    }

    for (const file of malformedFiles) {
      // eslint-disable-next-line no-console
      console.error(`- malformed: ${file}`);
    }

    process.exit(1);
  }

  const storybookBin = path.resolve(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "storybook.cmd" : "storybook",
  );
  if (!existsSync(storybookBin)) {
    // eslint-disable-next-line no-console
    console.error(
      "Storybook workflow check failed: install dependencies before running the gate.",
    );
    process.exit(1);
  }

  const outputDirectory = mkdtempSync(
    path.join(tmpdir(), "tijarahjo-storybook-check-"),
  );

  try {
    const build = spawnSync(
      storybookBin,
      [
        "build",
        "--test",
        "--disable-telemetry",
        "--output-dir",
        outputDirectory,
      ],
      {
        cwd: process.cwd(),
        env: { ...process.env, STORYBOOK_DISABLE_TELEMETRY: "1" },
        stdio: "inherit",
      },
    );

    if (typeof build.status !== "number" || build.status !== 0) {
      // eslint-disable-next-line no-console
      console.error(
        "Storybook workflow check failed: the baseline stories did not compile into a static test build.",
      );
      process.exitCode = 1;
      return;
    }

    const forbiddenPwaArtifacts = [
      "manifest.webmanifest",
      "notifications-sw.js",
      "registerSW.js",
      "sw.js",
    ].filter((file) => existsSync(path.join(outputDirectory, file)));
    if (forbiddenPwaArtifacts.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        `Storybook workflow check failed: app PWA artifacts leaked into the isolated preview (${forbiddenPwaArtifacts.join(", ")}).`,
      );
      process.exitCode = 1;
      return;
    }

    // eslint-disable-next-line no-console
    console.log(
      `Storybook workflow check passed: ${REQUIRED_STORY_FILES.length} baseline stories compiled.`,
    );
  } finally {
    rmSync(outputDirectory, { force: true, recursive: true });
  }
}

main();
