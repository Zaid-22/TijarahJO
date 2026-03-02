import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve(process.cwd(), "src");
const TEXT_ARBITRARY_PATTERN = /text-\[[^\]]+\]/g;
const SPACING_ARBITRARY_PATTERN =
  /(?:^|[\s"'`])(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y)-\[[^\]]+\]/g;
const POSITION_ARBITRARY_PATTERN =
  /(?:^|[\s"'`])(top|right|bottom|left|inset)-\[[^\]]+\]/g;
const HEIGHT_ARBITRARY_PATTERN =
  /(?:^|[\s"'`])(min-h|max-h)-\[[^\]]+\]/g;
const SHADOW_ARBITRARY_PATTERN = /shadow-\[[^\]]+\]/g;
const SCALE_ARBITRARY_PATTERN =
  /(?:^|[\s"'`])(?:hover:|active:|focus:)?scale-\[[^\]]+\]/g;
const ANIMATION_ARBITRARY_PATTERN = /\[animation-[^\]]+\]/g;
const OBJECT_ARBITRARY_PATTERN = /object-\[[^\]]+\]/g;

function walkFiles(dirPath) {
  const entries = readdirSync(dirPath);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function collectMatches(pattern, line) {
  const matches = line.match(pattern);
  if (!matches) {
    return [];
  }

  return matches.map((value) => value.trim());
}

function main() {
  const files = walkFiles(SRC_DIR);
  const violations = [];

  for (const filePath of files) {
    const relativePath = path
      .relative(process.cwd(), filePath)
      .replace(/\\/g, "/");
    const enforcePositionScale =
      relativePath.includes("/pages/") || relativePath.includes("/features/");
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const textMatches = collectMatches(TEXT_ARBITRARY_PATTERN, line);
      const spacingMatches = collectMatches(SPACING_ARBITRARY_PATTERN, line);
      const positionMatches = enforcePositionScale
        ? collectMatches(POSITION_ARBITRARY_PATTERN, line)
        : [];
      const heightMatches = enforcePositionScale
        ? collectMatches(HEIGHT_ARBITRARY_PATTERN, line)
        : [];
      const shadowMatches = enforcePositionScale
        ? collectMatches(SHADOW_ARBITRARY_PATTERN, line)
        : [];
      const scaleMatches = enforcePositionScale
        ? collectMatches(SCALE_ARBITRARY_PATTERN, line)
        : [];
      const animationMatches = enforcePositionScale
        ? collectMatches(ANIMATION_ARBITRARY_PATTERN, line)
        : [];
      const objectMatches = enforcePositionScale
        ? collectMatches(OBJECT_ARBITRARY_PATTERN, line)
        : [];
      const matches = [
        ...textMatches,
        ...spacingMatches,
        ...positionMatches,
        ...heightMatches,
        ...shadowMatches,
        ...scaleMatches,
        ...animationMatches,
        ...objectMatches,
      ];

      for (const match of matches) {
        violations.push(`${relativePath}:${index + 1} -> ${match}`);
      }
    });
  }

  if (violations.length === 0) {
    return;
  }

  console.error(
    "Design-system scale check failed: avoid arbitrary typography/spacing/motion classes and magic position offsets in TS/TSX files.",
  );
  console.error(
    "Use token-based classes (e.g., text-sm, p-4, gap-2, top-3, min-h-96, shadow-md, hover:scale-105, object-center) instead of arbitrary values.",
  );
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

main();
