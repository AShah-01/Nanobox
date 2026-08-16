#!/usr/bin/env node
// Tiny static file server for the local setup guide — no extra dependencies.
// Run with `npm run guide`, or `nanobox` once linked globally (see README).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const root = join(fileURLToPath(import.meta.url), "..", "setup-guide");
const port = 4317;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = createServer(async (req, res) => {
  const path = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const filePath = join(root, path);

  if (!filePath.startsWith(root)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`Nanobox setup guide running at ${url} (Ctrl+C to stop)`);
  openBrowser(url);
});

function openBrowser(url) {
  const command =
    process.platform === "win32" ? `start "" "${url}"` : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
  exec(command, (err) => {
    if (err) console.log(`Couldn't auto-open a browser — visit ${url} manually.`);
  });
}
