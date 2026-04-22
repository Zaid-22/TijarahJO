import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve(process.cwd(), "src");
const HEX_COLOR_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;

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

const IGNORE_FILES = [
  "src/shared/design/colorTokens.ts",
];

function main() {
  const files = walkFiles(SRC_DIR);
  const violations = [];

  for (const filePath of files) {
    const relativePath = path
      .relative(process.cwd(), filePath)
      .replace(/\\/g, "/");

    if (IGNORE_FILES.includes(relativePath)) {
      continue;
    }

    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const matches = line.match(HEX_COLOR_PATTERN);
      if (!matches) {
        return;
      }

      for (const hex of matches) {
        violations.push(`${relativePath}:${index + 1} -> ${hex}`);
      }
    });
  }

  if (violations.length === 0) {
    return;
  }

  // eslint-disable-next-line no-console
  console.error(
    "Design-system check failed: hardcoded hex colors are not allowed in TS/TSX files.",
  );
  for (const violation of violations) {
    // eslint-disable-next-line no-console
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

main();
