const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const host = process.argv[2] || "127.0.0.1";
const port = Number(process.argv[3] || "4173");
const distDir = path.resolve(__dirname, "..", "dist");
const indexPath = path.join(distDir, "index.html");

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sendFile(res, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType =
    CONTENT_TYPES[extension] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
}

function sendNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

function shouldServeSpaFallback(requestPath) {
  if (requestPath === "/") {
    return true;
  }

  const lastSegment = requestPath.split("/").pop() || "";
  return !lastSegment.includes(".");
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendNotFound(res);
    return;
  }

  const requestPath = decodeURIComponent(req.url.split("?")[0] || "/");
  const relativePath =
    requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const resolvedPath = path.resolve(distDir, relativePath);

  if (!resolvedPath.startsWith(distDir)) {
    sendNotFound(res);
    return;
  }

  fs.stat(resolvedPath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(res, resolvedPath);
      return;
    }

    if (shouldServeSpaFallback(requestPath)) {
      sendFile(res, indexPath);
      return;
    }

    sendNotFound(res);
  });
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`dist server listening on http://${host}:${port}`);
});

function shutdown(signal) {
  server.close(() => {
    process.exit(signal === "SIGTERM" ? 0 : 130);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
