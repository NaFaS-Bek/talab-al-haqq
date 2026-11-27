#!/usr/bin/env node
/**
 * Deterministically prepare the verified static-site release using Node built-ins only.
 * Mirrors tool/prepare_website.py so Cloudflare Builds does not depend on Python.
 */
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SW = join(ROOT, "sw.js");
const REQUIRED = [
  "index.html", "app.js", "i18n.js", "style.css", "pillars-common.css",
  "manifest.webmanifest", "icon.svg",
  "data/content.json", "data/caliph_history.json",
  "TANZIL-LICENSE.txt",
];
const ASSET_DIRS = ["fonts", "icons"];
const MAX_ASSET_COUNT = 120;

function fail(message) {
  throw new Error(message);
}

function listFilesRecursively(folder) {
  if (!existsSync(folder)) return [];
  const output = [];
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const absolute = join(folder, entry.name);
    if (entry.isSymbolicLink()) {
      output.push(absolute);
    } else if (entry.isDirectory()) {
      output.push(...listFilesRecursively(absolute));
    } else if (entry.isFile()) {
      output.push(absolute);
    }
  }
  return output;
}

function resourceFiles() {
  const paths = [...REQUIRED];
  for (const name of readdirSync(ROOT)) {
    if (name.endsWith(".html") && name !== "index.html") paths.push(name);
  }
  for (const subdir of ASSET_DIRS) {
    for (const absolute of listFilesRecursively(join(ROOT, subdir))) {
      paths.push(relative(ROOT, absolute).split(sep).join("/"));
    }
  }
  if (new Set(paths).size !== paths.length) fail("Duplicate packaged path");
  const htmlCount = paths.filter((name) => name.endsWith(".html")).length;
  if (htmlCount < 22 || htmlCount > 100) {
    fail("HTML curriculum inventory unexpectedly changed");
  }
  if (paths.length > MAX_ASSET_COUNT) fail("Too many assets: review packaging scope");

  paths.sort();
  for (const name of paths) {
    const absolute = join(ROOT, name);
    if (!absolute.startsWith(ROOT + sep) || name.split("/").includes("..")) {
      fail(`Unsafe release path: ${name}`);
    }
    const stat = lstatSync(absolute);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      fail(`Missing or unsafe release file: ${name}`);
    }
  }
  return paths;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function makeRelease(paths) {
  const resources = {};
  for (const name of paths) {
    const data = readFileSync(join(ROOT, name));
    if (data.length === 0) fail(`Empty asset must be reviewed: ${name}`);
    resources[name] = sha256(data);
  }
  // Paths are sorted, matching Python's sort_keys=True canonical serialization.
  const canonical = JSON.stringify(resources);
  return { resources, version: sha256(Buffer.from(canonical, "utf8")) };
}

function preparedSw(release) {
  const original = readFileSync(SW, "utf8");
  const matches = [...original.matchAll(/^const RELEASE = (?:null|\{[^\r\n]+\});(?=\r?$)/gm)];
  if (matches.length !== 1) {
    fail("sw.js must contain exactly one single-line RELEASE declaration");
  }
  const serialized = JSON.stringify({ resources: release.resources, version: release.version });
  return original.replace(matches[0][0], `const RELEASE = ${serialized};`);
}

function buildRelease(destination, paths, outputSw, release) {
  const target = resolve(destination);
  if (target !== resolve(ROOT, "build", "website")) {
    fail("Build destination must be exactly build/website (safe clean target)");
  }
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });

  for (const name of [...paths, "_headers"]) {
    const source = join(ROOT, name);
    if (!existsSync(source) || !lstatSync(source).isFile()) {
      fail(`Missing deploy asset: ${name}`);
    }
    const output = join(target, name);
    mkdirSync(dirname(output), { recursive: true });
    copyFileSync(source, output);
  }
  writeFileSync(join(target, "sw.js"), outputSw);

  for (const [name, expected] of Object.entries(release.resources)) {
    const actual = sha256(readFileSync(join(target, name)));
    if (actual !== expected) fail(`Built release hash mismatch: ${name}`);
  }
  if (existsSync(join(target, "tool"))) fail("Never deploy source or audit tools");
}

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1 && !(args.length === 2 && args[0] === "--build")) {
    fail("Usage: node tool/prepare_website.mjs --print-manifest | --check-root | --write-root | --build build/website");
  }
  const mode = args[0];
  if (!["--print-manifest", "--check-root", "--write-root", "--build"].includes(mode)) {
    fail(`Unknown option: ${mode}`);
  }
  if (mode === "--build" && args.length !== 2) fail("--build requires a directory");
  if (mode !== "--build" && args.length !== 1) fail(`${mode} does not accept a directory`);

  const paths = resourceFiles();
  const release = makeRelease(paths);
  const outputSw = preparedSw(release);
  const currentSw = readFileSync(SW);
  const rootIsCurrent = currentSw.equals(Buffer.from(outputSw, "utf8"));

  if (mode === "--print-manifest") {
    console.log("PWA_RELEASE_MANIFEST=" + JSON.stringify({ resources: release.resources, version: release.version }));
    console.log(`PWA_RELEASE_FILES=${paths.length}`);
    console.log(`PWA_RELEASE_VERSION=${release.version}`);
  } else if (mode === "--check-root") {
    if (!rootIsCurrent) {
      console.error("FAILED: sw.js has stale or null RELEASE. Run the Python or Node prepare_website script with --write-root and commit sw.js.");
      process.exitCode = 1;
      return;
    }
    console.log(`PASS: source sw.js matches ${paths.length} verified assets, version ${release.version}`);
  } else if (mode === "--write-root") {
    writeFileSync(SW, outputSw);
    console.log(`Prepared sw.js with ${paths.length} SHA-256 resources, version ${release.version}`);
  } else {
    buildRelease(args[1], paths, outputSw, release);
    console.log(`PASS: built ${args[1]} with ${paths.length} verified offline assets and sw.js, version ${release.version}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
