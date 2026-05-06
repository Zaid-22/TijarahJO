import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve(process.cwd(), "src");
const STYLE_TOKEN = "style={{";

const ALLOWED_STYLE_USAGE = new Map([
  ["src/shared/ui/image-lightbox.tsx", 1],
  ["src/features/marketplace/pages/ComparePage.tsx", 1]
]);

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

    if (fullPath.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function countInlineStyles(content) {
  return content.split(STYLE_TOKEN).length - 1;
}

function main() {
  const files = walkFiles(SRC_DIR);
  const violations = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");
    const inlineStyleCount = countInlineStyles(content);
    if (inlineStyleCount === 0) {
      continue;
    }

    const relativePath = path
      .relative(process.cwd(), filePath)
      .replace(/\\/g, "/");
    const allowedCount = ALLOWED_STYLE_USAGE.get(relativePath);
    if (allowedCount === undefined) {
      violations.push(
        `${relativePath}: inline styles are not allowed (${inlineStyleCount} found)`,
      );
      continue;
    }

    if (inlineStyleCount > allowedCount) {
      violations.push(
        `${relativePath}: found ${inlineStyleCount} inline styles, allowed ${allowedCount}`,
      );
    }
  }

  if (violations.length === 0) {
    return;
  }

  // eslint-disable-next-line no-console
  console.error(
    "Styling check failed: inline styles are blocked project-wide.",
  );
  for (const violation of violations) {
    // eslint-disable-next-line no-console
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

main();
