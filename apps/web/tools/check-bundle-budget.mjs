import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const assetsDir = path.resolve(process.cwd(), "dist/assets");
const manifestPath = path.resolve(process.cwd(), "dist/.vite/manifest.json");

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

function collectEagerJsFiles() {
  if (!existsSync(manifestPath)) {
    throw new Error("No Vite manifest found in dist/.vite/manifest.json.");
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const eagerFiles = new Set();
  const visited = new Set();

  const visitChunk = (manifestKey) => {
    if (visited.has(manifestKey)) {
      return;
    }

    visited.add(manifestKey);
    const chunk = manifest[manifestKey];
    if (!chunk || typeof chunk !== "object") {
      return;
    }

    if (typeof chunk.file === "string" && chunk.file.endsWith(".js")) {
      eagerFiles.add(path.basename(chunk.file));
    }

    if (Array.isArray(chunk.imports)) {
      chunk.imports.forEach((importKey) => visitChunk(importKey));
    }
  };

  const entryKeys = Object.entries(manifest)
    .filter(([, chunk]) => chunk?.isEntry && typeof chunk.file === "string")
    .map(([manifestKey]) => manifestKey);

  if (entryKeys.length === 0) {
    throw new Error("No Vite entry chunks found in dist/.vite/manifest.json.");
  }

  entryKeys.forEach((manifestKey) => visitChunk(manifestKey));
  return eagerFiles;
}

function findByPrefix(assets, prefix) {
  return assets.find((asset) => asset.file.startsWith(`${prefix}-`));
}

function validate() {
  const allAssets = collectAssets();
  const jsAssets = allAssets.filter((asset) => asset.ext === ".js");
  const cssAssets = allAssets.filter((asset) => asset.ext === ".css");
  const eagerJsFiles = collectEagerJsFiles();
  const eagerJsAssets = jsAssets.filter((asset) => eagerJsFiles.has(asset.file));
  const lazyJsAssets = jsAssets.filter((asset) => !eagerJsFiles.has(asset.file));
  const genericLazyJsAssets = lazyJsAssets.filter(
    (asset) =>
      !asset.file.startsWith("recharts-vendor-") &&
      !asset.file.startsWith("victory-vendor-"),
  );

  if (jsAssets.length === 0) {
    throw new Error("No JS assets found in dist/assets. Run build first.");
  }

  if (eagerJsAssets.length === 0) {
    throw new Error("No eager JS assets found from dist/.vite/manifest.json.");
  }

  const largestEagerJsChunk = [...eagerJsAssets].sort(
    (a, b) => b.gzipSize - a.gzipSize,
  )[0];
  const totalEagerJsGzip = eagerJsAssets.reduce(
    (acc, asset) => acc + asset.gzipSize,
    0,
  );
  const largestLazyJsChunk =
    genericLazyJsAssets.length > 0
      ? [...genericLazyJsAssets].sort((a, b) => b.gzipSize - a.gzipSize)[0]
      : null;
  const largestCssChunk = [...cssAssets].sort(
    (a, b) => b.gzipSize - a.gzipSize,
  )[0];

  const checks = [
    {
      name: "Largest eager JS chunk (gzip)",
      actual: largestEagerJsChunk.gzipSize,
      limit: 90 * 1024,
      detail: largestEagerJsChunk.file,
    },
    {
      name: "Initial JS budget (gzip)",
      actual: totalEagerJsGzip,
      limit: 190 * 1024,
      detail: `${eagerJsAssets.length} entry-graph chunks`,
    },
    {
      name: "Largest CSS chunk (gzip)",
      actual: largestCssChunk?.gzipSize ?? 0,
      limit: 24 * 1024,
      detail: largestCssChunk?.file ?? "none",
    },
  ];

  if (largestLazyJsChunk) {
    checks.push({
      name: "Largest non-chart lazy JS chunk (gzip)",
      actual: largestLazyJsChunk.gzipSize,
      limit: 70 * 1024,
      detail: largestLazyJsChunk.file,
    });
  }

  const rechartsVendorChunk = findByPrefix(jsAssets, "recharts-vendor");
  if (rechartsVendorChunk) {
    checks.push({
      name: "recharts-vendor chunk (gzip)",
      actual: rechartsVendorChunk.gzipSize,
      limit: 90 * 1024,
      detail: rechartsVendorChunk.file,
    });
  }

  const victoryVendorChunk = findByPrefix(jsAssets, "victory-vendor");
  if (victoryVendorChunk) {
    checks.push({
      name: "victory-vendor chunk (gzip)",
      actual: victoryVendorChunk.gzipSize,
      limit: 25 * 1024,
      detail: victoryVendorChunk.file,
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
