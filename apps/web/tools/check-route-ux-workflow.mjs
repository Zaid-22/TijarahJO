import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const REQUIRED_SPEC_PATH = "tests/browser-e2e/route-ux.spec.cjs";
const REQUIRED_TEST_TITLES = [
  "unknown route shows recovery context and home action",
  "seller profile back path safely returns to marketplace",
  "auth screen renders Arabic-first copy when language is Arabic",
];

function main() {
  const specAbsolutePath = path.resolve(process.cwd(), REQUIRED_SPEC_PATH);
  if (!existsSync(specAbsolutePath)) {
    console.error(
      `Route UX workflow check failed: missing required spec ${REQUIRED_SPEC_PATH}`,
    );
    process.exit(1);
  }

  const content = readFileSync(specAbsolutePath, "utf8");
  const missingTitles = REQUIRED_TEST_TITLES.filter((title) => !content.includes(title));

  if (missingTitles.length === 0) {
    return;
  }

  console.error(
    "Route UX workflow check failed: required route-level UX tests are missing.",
  );
  for (const missingTitle of missingTitles) {
    console.error(`- missing test: ${missingTitle}`);
  }
  process.exit(1);
}

main();
