import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const assetsDir = path.resolve(process.cwd(), "dist/assets");

function toKb(bytes) {
  return bytes / 1024;
}

function formatKb(bytes) {
  return `${toKb(bytes).toFixed(2)}KB`;
}

function collectAssets() {
  const files = readdirSync(assetsDir);
  return files
    .filter((file) => file.endsWith(".js") || file.endsWith(".css"))
    .map((file) => {
      const fullPath = path.join(assetsDir, file);
      const content = readFileSync(fullPath);
      const gzipSize = zlib.gzipSync(content).length;

      return {
        file,
        ext: path.extname(file),
        rawSize: statSync(fullPath).size,
        gzipSize,
      };
    });
}

function findByPrefix(assets, prefix) {
  return assets.find((asset) => asset.file.startsWith(`${prefix}-`));
}

function validate() {
  const allAssets = collectAssets();
  const jsAssets = allAssets.filter((asset) => asset.ext === ".js");
  const cssAssets = allAssets.filter((asset) => asset.ext === ".css");

  if (jsAssets.length === 0) {
    throw new Error("No JS assets found in dist/assets. Run build first.");
  }

  const largestJsChunk = [...jsAssets].sort(
    (a, b) => b.gzipSize - a.gzipSize,
  )[0];
  const totalJsGzip = jsAssets.reduce((acc, asset) => acc + asset.gzipSize, 0);
  const largestCssChunk = [...cssAssets].sort(
    (a, b) => b.gzipSize - a.gzipSize,
  )[0];

  const checks = [
    {
      name: "Largest JS chunk (gzip)",
      actual: largestJsChunk.gzipSize,
      limit: 70 * 1024,
      detail: largestJsChunk.file,
    },
    {
      name: "Total JS budget (gzip)",
      actual: totalJsGzip,
      limit: 330 * 1024,
      detail: `${jsAssets.length} chunks`,
    },
    {
      name: "Largest CSS chunk (gzip)",
      actual: largestCssChunk?.gzipSize ?? 0,
      limit: 20 * 1024,
      detail: largestCssChunk?.file ?? "none",
    },
  ];

  const appRoutesChunk = findByPrefix(jsAssets, "AppRoutes");
  if (appRoutesChunk) {
    checks.push({
      name: "AppRoutes chunk (gzip)",
      actual: appRoutesChunk.gzipSize,
      limit: 35 * 1024,
      detail: appRoutesChunk.file,
    });
  }

  const reactVendorChunk = findByPrefix(jsAssets, "react-vendor");
  if (reactVendorChunk) {
    checks.push({
      name: "react-vendor chunk (gzip)",
      actual: reactVendorChunk.gzipSize,
      limit: 50 * 1024,
      detail: reactVendorChunk.file,
    });
  }

  const failures = checks.filter((check) => check.actual > check.limit);

  console.log("Bundle budget report:");
  for (const check of checks) {
    const status = check.actual > check.limit ? "FAIL" : "PASS";
    console.log(
      `${status} ${check.name}: ${formatKb(check.actual)} / ${formatKb(check.limit)} (${check.detail})`,
    );
  }

  if (failures.length > 0) {
    const failureSummary = failures
      .map(
        (check) =>
          `${check.name} exceeded by ${formatKb(check.actual - check.limit)}`,
      )
      .join("; ");
    throw new Error(`Bundle budget exceeded: ${failureSummary}`);
  }
}

validate();
