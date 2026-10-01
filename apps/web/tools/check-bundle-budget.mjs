import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const assetsDir = path.resolve(process.cwd(), "dist/assets");
const distDir = path.resolve(process.cwd(), "dist");
const manifestPath = path.resolve(process.cwd(), "dist/.vite/manifest.json");
const serviceWorkerPath = path.resolve(distDir, "sw.js");
const appEntryPath = path.resolve(process.cwd(), "src/app/main.tsx");

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

function collectPwaPrecacheReport() {
  if (!existsSync(serviceWorkerPath)) {
    throw new Error("No generated service worker found at dist/sw.js.");
  }

  const serviceWorkerSource = readFileSync(serviceWorkerPath, "utf8");
  if (!serviceWorkerSource.includes("notifications-sw.js")) {
    throw new Error(
      "dist/sw.js does not import notifications-sw.js; push handlers would be orphaned in production.",
    );
  }

  const urls = Array.from(
    serviceWorkerSource.matchAll(/\{url:"([^"]+)"/g),
    (match) => match[1],
  );
  if (urls.length === 0) {
    throw new Error("No Workbox precache entries found in dist/sw.js.");
  }

  const forbiddenUrl = urls.find(
    (url) =>
      url.startsWith("banners/") ||
      url.includes("recharts-vendor-") ||
      url.includes("victory-vendor-"),
  );
  if (forbiddenUrl) {
    throw new Error(
      `PWA precache contains a route-only or promotional asset: ${forbiddenUrl}.`,
    );
  }

  const gzipSize = urls.reduce((total, url) => {
    const decodedUrl = decodeURIComponent(url.split(/[?#]/, 1)[0]);
    const filePath = path.resolve(distDir, decodedUrl.replace(/^\/+/, ""));
    const isInsideDist =
      filePath === distDir || filePath.startsWith(`${distDir}${path.sep}`);
    if (!isInsideDist || !existsSync(filePath)) {
      throw new Error(`PWA precache entry is missing from dist: ${url}.`);
    }

    return total + zlib.gzipSync(readFileSync(filePath)).length;
  }, 0);

  return { entryCount: urls.length, gzipSize };
}

function assertNoRouteWarmupsInAppEntry() {
  if (!existsSync(appEntryPath)) {
    throw new Error("No application entry found at src/app/main.tsx.");
  }

  const appEntrySource = readFileSync(appEntryPath, "utf8");
  const forbiddenStartupImports = [
    "../features/home/pages/HomePage",
    "../features/home/components/HomeDeferredSections",
  ];
  const matchedImport = forbiddenStartupImports.find((specifier) =>
    appEntrySource.includes(`import(\"${specifier}\")`) ||
    appEntrySource.includes(`import('${specifier}')`),
  );

  if (matchedImport) {
    throw new Error(
      `src/app/main.tsx eagerly imports ${matchedImport}. Route chunks must stay behind their React.lazy boundary so the manifest entry graph remains the real startup cost.`,
    );
  }
}

function collectEntryGraphFiles() {
  if (!existsSync(manifestPath)) {
    throw new Error("No Vite manifest found in dist/.vite/manifest.json.");
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const jsFiles = new Set();
  const cssFiles = new Set();
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
      jsFiles.add(path.basename(chunk.file));
    }

    if (Array.isArray(chunk.css)) {
      chunk.css.forEach((cssFile) => cssFiles.add(path.basename(cssFile)));
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
  return { cssFiles, jsFiles };
}

function findByPrefix(assets, prefix) {
  return assets.find((asset) => asset.file.startsWith(`${prefix}-`));
}

function validate() {
  assertNoRouteWarmupsInAppEntry();

  const allAssets = collectAssets();
  const pwaPrecache = collectPwaPrecacheReport();
  const jsAssets = allAssets.filter((asset) => asset.ext === ".js");
  const cssAssets = allAssets.filter((asset) => asset.ext === ".css");
  const entryGraphFiles = collectEntryGraphFiles();
  const eagerJsAssets = jsAssets.filter((asset) =>
    entryGraphFiles.jsFiles.has(asset.file),
  );
  const eagerCssAssets = cssAssets.filter((asset) =>
    entryGraphFiles.cssFiles.has(asset.file),
  );
  const lazyJsAssets = jsAssets.filter(
    (asset) => !entryGraphFiles.jsFiles.has(asset.file),
  );
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
  const totalEagerCssGzip = eagerCssAssets.reduce(
    (acc, asset) => acc + asset.gzipSize,
    0,
  );
  const largestLazyJsChunk =
    genericLazyJsAssets.length > 0
      ? [...genericLazyJsAssets].sort((a, b) => b.gzipSize - a.gzipSize)[0]
      : null;
  const checks = [
    {
      name: "Largest eager JS chunk (gzip)",
      actual: largestEagerJsChunk.gzipSize,
      limit: 90 * 1024,
      detail: largestEagerJsChunk.file,
    },
    {
      name: "Initial app-shell JS, static entry graph (gzip)",
      actual: totalEagerJsGzip,
      limit: 190 * 1024,
      detail: `${eagerJsAssets.length} entry-graph chunks`,
    },
    {
      name: "Initial app-shell CSS, static entry graph (gzip)",
      actual: totalEagerCssGzip,
      // Current verified baseline is ~24.5KB after the responsive, offline,
      // and accessible-state styles. Keep only 0.5KB of regression headroom.
      limit: 25 * 1024,
      detail: `${eagerCssAssets.length} entry-graph chunks`,
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
  const pwaPrecacheFailures = [];
  if (pwaPrecache.entryCount > 20) {
    pwaPrecacheFailures.push(
      `PWA app-shell precache contains ${pwaPrecache.entryCount} entries (limit: 20)`,
    );
  }
  if (pwaPrecache.gzipSize > 220 * 1024) {
    pwaPrecacheFailures.push(
      `PWA app-shell precache transfer exceeded by ${formatKb(pwaPrecache.gzipSize - 220 * 1024)}`,
    );
  }

  console.log("Bundle budget report:");
  console.log(
    "Startup scope: files statically reachable from Vite entry chunks. Route-level dynamic chunks are measured by the lazy-chunk budgets.",
  );
  for (const check of checks) {
    const status = check.actual > check.limit ? "FAIL" : "PASS";
    console.log(
      `${status} ${check.name}: ${formatKb(check.actual)} / ${formatKb(check.limit)} (${check.detail})`,
    );
  }
  const pwaStatus = pwaPrecacheFailures.length === 0 ? "PASS" : "FAIL";
  console.log(
    `${pwaStatus} PWA app-shell precache: ${pwaPrecache.entryCount} entries, ${formatKb(pwaPrecache.gzipSize)} gzip-equivalent transfer (limits: 20 entries, ${formatKb(220 * 1024)})`,
  );

  if (failures.length > 0 || pwaPrecacheFailures.length > 0) {
    const failureSummary = [
      ...failures.map(
        (check) =>
          `${check.name} exceeded by ${formatKb(check.actual - check.limit)}`,
      ),
      ...pwaPrecacheFailures,
    ].join("; ");
    throw new Error(`Performance budget exceeded: ${failureSummary}`);
  }
}

validate();
