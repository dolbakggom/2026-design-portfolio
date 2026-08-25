import { mkdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const bucket = "portfolio-media";
const dumpPath = process.argv[2];

if (!dumpPath) {
  throw new Error("Usage: node scripts/promote-r2-assets.mjs <local-d1-dump.sql>");
}

const parseSqlValues = (line) => {
  const start = line.indexOf("VALUES(");
  const end = line.lastIndexOf(");");
  if (start < 0 || end < 0) return [];

  const raw = line.slice(start + "VALUES(".length, end);
  const values = [];
  let current = "";
  let inString = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    const next = raw[index + 1];

    if (char === "'" && inString && next === "'") {
      current += "'";
      index += 1;
      continue;
    }

    if (char === "'") {
      inString = !inString;
      continue;
    }

    if (char === "," && !inString) {
      values.push(current === "NULL" ? null : current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current === "NULL" ? null : current);
  return values;
};

const parseInsert = (line) => {
  const match = line.match(/^INSERT INTO "([^"]+)" \(([^)]+)\) VALUES\(/);
  if (!match) return null;

  const columns = match[2].split(",").map((column) => column.trim().replaceAll('"', ""));
  const values = parseSqlValues(line);
  return {
    table: match[1],
    row: Object.fromEntries(columns.map((column, index) => [column, values[index]]))
  };
};

const objectMap = new Map();
readFileSync(dumpPath, "utf8")
  .split("\n")
  .map(parseInsert)
  .filter((insert) => insert && ["assets", "asset_variants"].includes(insert.table))
  .forEach(({ row }) => {
    if (typeof row.r2_key !== "string" || !row.r2_key) return;
    objectMap.set(row.r2_key, {
      key: row.r2_key,
      mime: typeof row.mime === "string" && row.mime ? row.mime : "application/octet-stream"
    });
  });

const objects = [...objectMap.values()];
if (!objects.length) throw new Error("No R2 object keys found in the local D1 dump.");

const tempRoot = path.join(os.tmpdir(), `portfolio-r2-promote-${Date.now()}`);
mkdirSync(tempRoot, { recursive: true });

const runWrangler = (arguments_, label) => {
  const result = spawnSync("npx", ["wrangler", ...arguments_], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? 1}`);
};

try {
  console.log(`Preflighting ${objects.length} local R2 objects...`);
  for (const [index, object] of objects.entries()) {
    const filePath = path.join(tempRoot, object.key);
    mkdirSync(path.dirname(filePath), { recursive: true });
    console.log(`[local ${index + 1}/${objects.length}] ${object.key}`);
    runWrangler(
      ["r2", "object", "get", `${bucket}/${object.key}`, "--local", "--file", filePath],
      `Local R2 read for ${object.key}`
    );
  }

  console.log(`Uploading ${objects.length} verified objects to remote R2...`);
  for (const [index, object] of objects.entries()) {
    const filePath = path.join(tempRoot, object.key);
    console.log(`[remote ${index + 1}/${objects.length}] ${object.key}`);
    runWrangler(
      ["r2", "object", "put", `${bucket}/${object.key}`, "--remote", "--file", filePath, "--content-type", object.mime, "--force"],
      `Remote R2 write for ${object.key}`
    );
  }

  console.log("Local R2 content promotion complete.");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
