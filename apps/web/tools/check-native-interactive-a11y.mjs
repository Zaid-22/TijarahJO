import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve(process.cwd(), "src");
const IGNORED_FILES = new Set([
  "src/shared/ui/button.tsx",
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

function getLineNumber(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content[i] === "\n") {
      line += 1;
    }
  }
  return line;
}

function hasAccessibleName(attrs) {
  return (
    /\baria-label\s*=/.test(attrs) ||
    /\baria-labelledby\s*=/.test(attrs) ||
    /\btitle\s*=/.test(attrs)
  );
}

function detectVisualText(children) {
  const plainText = children
    .replace(/<[^>]+>/g, "")
    .replace(/\{[^}]*\}/g, "")
    .trim();
  const hasNonJsxExpression =
    /\{[^}]+\}/.test(children) && !/\{[^}]*<[A-Z]/.test(children);
  return plainText.length > 0 || hasNonJsxExpression;
}

function detectIconOnly(children) {
  const hasVisualText = detectVisualText(children);
  if (hasVisualText) {
    return false;
  }

  return /<\s*(svg|[A-Z][A-Za-z0-9]*)\b/.test(children);
}

function findViolations(filePath) {
  const content = readFileSync(filePath, "utf8");
  const violations = [];

  const nativeButtonRegex = /<button\b([\s\S]*?)>([\s\S]*?)<\/button>/g;
  let match = nativeButtonRegex.exec(content);
  while (match) {
    const attrs = (match[1] || "").trim();
    const children = match[2] || "";
    const line = getLineNumber(content, match.index);

    if (!/\btype\s*=/.test(attrs)) {
      violations.push({
        line,
        rule: "button-missing-type",
        message: "Native <button> must include an explicit type attribute.",
      });
    }

    if (detectIconOnly(children) && !hasAccessibleName(attrs)) {
      violations.push({
        line,
        rule: "button-icon-missing-label",
        message:
          "Icon-only native <button> must include aria-label, aria-labelledby, or title.",
      });
    }

    match = nativeButtonRegex.exec(content);
  }

  const nativeAnchorRegex = /<a\b([\s\S]*?)>([\s\S]*?)<\/a>/g;
  match = nativeAnchorRegex.exec(content);
  while (match) {
    const attrs = (match[1] || "").trim();
    const children = match[2] || "";
    const line = getLineNumber(content, match.index);

    if (!/\bhref\s*=/.test(attrs)) {
      violations.push({
        line,
        rule: "anchor-missing-href",
        message: "Native <a> must include href for keyboard and screen-reader support.",
      });
    }

    if (detectIconOnly(children) && !hasAccessibleName(attrs)) {
      violations.push({
        line,
        rule: "anchor-icon-missing-label",
        message:
          "Icon-only native <a> must include aria-label, aria-labelledby, or title.",
      });
    }

    match = nativeAnchorRegex.exec(content);
  }

  return violations;
}

function main() {
  const files = walkFiles(SRC_DIR);
  const issues = [];

  for (const filePath of files) {
    const relativePath = path
      .relative(process.cwd(), filePath)
      .replace(/\\/g, "/");
    if (IGNORED_FILES.has(relativePath)) {
      continue;
    }

    const violations = findViolations(filePath);
    for (const violation of violations) {
      issues.push({ relativePath, ...violation });
    }
  }

  if (issues.length === 0) {
    return;
  }

  console.error(
    "Accessibility check failed: native interactive elements are missing required accessibility attributes.",
  );
  for (const issue of issues) {
    console.error(
      `- ${issue.relativePath}:${issue.line} [${issue.rule}] ${issue.message}`,
    );
  }
  process.exit(1);
}

main();
