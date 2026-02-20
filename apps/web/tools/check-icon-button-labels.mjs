import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve(process.cwd(), "src");

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

function findViolations(filePath) {
  const content = readFileSync(filePath, "utf8");
  const violations = [];
  const buttonRegex =
    /<Button\b([\s\S]*?)>([\s\S]*?)<\/Button>|<Button\b([\s\S]*?)\/>/g;
  const nativeButtonRegex = /<button\b([\s\S]*?)>([\s\S]*?)<\/button>/g;

  let match = buttonRegex.exec(content);
  while (match) {
    const attributes = (match[1] || match[3] || "").trim();
    const children = match[2] || "";
    const hasA11yLabel =
      /aria-label\s*=/.test(attributes) || /title\s*=/.test(attributes);
    const isIconSizeButton = /size\s*=\s*["']icon["']/.test(attributes);
    const plainTextContent = children
      .replace(/<[^>]+>/g, "")
      .replace(/\{[^}]*\}/g, "")
      .trim();
    const hasNonJsxExpression =
      /\{[^}]+\}/.test(children) && !/\{[^}]*<[A-Z]/.test(children);
    const hasVisibleText =
      plainTextContent.length > 0 || Boolean(hasNonJsxExpression);
    const hasIconChild = /<\s*[A-Z][A-Za-z0-9]*/.test(children);
    const isIconOnlyButton = isIconSizeButton || (hasIconChild && !hasVisibleText);

    if (isIconOnlyButton && !hasA11yLabel) {
      violations.push({
        line: getLineNumber(content, match.index),
      });
    }

    match = buttonRegex.exec(content);
  }

  match = nativeButtonRegex.exec(content);
  while (match) {
    const attributes = (match[1] || "").trim();
    const children = match[2] || "";
    const hasA11yLabel =
      /aria-label\s*=/.test(attributes) || /title\s*=/.test(attributes);
    const plainTextContent = children
      .replace(/<[^>]+>/g, "")
      .replace(/\{[^}]*\}/g, "")
      .trim();
    const hasNonJsxExpression =
      /\{[^}]+\}/.test(children) && !/\{[^}]*<[A-Z]/.test(children);
    const hasVisibleText =
      plainTextContent.length > 0 || Boolean(hasNonJsxExpression);
    const hasIconChild = /<\s*[A-Z][A-Za-z0-9]*/.test(children);
    const isIconOnlyButton = hasIconChild && !hasVisibleText;

    if (isIconOnlyButton && !hasA11yLabel) {
      violations.push({
        line: getLineNumber(content, match.index),
      });
    }

    match = nativeButtonRegex.exec(content);
  }

  return violations;
}

function main() {
  const files = walkFiles(SRC_DIR);
  const issues = [];

  for (const filePath of files) {
    const violations = findViolations(filePath);
    for (const violation of violations) {
      issues.push({
        filePath,
        line: violation.line,
      });
    }
  }

  if (issues.length === 0) {
    return;
  }

  console.error(
    "Accessibility check failed: icon-only button requires aria-label or title.",
  );
  for (const issue of issues) {
    const relativePath = path.relative(process.cwd(), issue.filePath);
    console.error(`- ${relativePath}:${issue.line}`);
  }
  process.exit(1);
}

main();
