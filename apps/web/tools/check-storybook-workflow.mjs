import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const REQUIRED_STORY_FILES = [
  "stories/ui/Button.stories.tsx",
  "stories/ui/SubpageHeader.stories.tsx",
  "stories/ui/ViewModeToggle.stories.tsx",
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

  if (missingFiles.length === 0 && malformedFiles.length === 0) {
    return;
  }

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

main();
