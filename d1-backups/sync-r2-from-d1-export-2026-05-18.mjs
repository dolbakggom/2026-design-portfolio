import { mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const bucket = "portfolio-media";
const dumpPath = "d1-backups/remote-prod-2026-05-18.sql";
const downloadRoot = "r2-backups/remote-prod-2026-05-18";

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

const dump = readFileSync(dumpPath, "utf8");
const assets = dump
  .split("\n")
  .filter((line) => line.startsWith('INSERT INTO "assets"'))
  .map((line) => {
    const values = parseSqlValues(line);
    return {
      key: values[1],
      mime: values[3] || "application/octet-stream"
    };
  })
  .filter((asset) => typeof asset.key === "string" && asset.key.length > 0);

if (!assets.length) {
  throw new Error("No R2 asset keys found in D1 export.");
}

console.log(`Syncing ${assets.length} R2 objects from remote to local...`);

for (const [index, asset] of assets.entries()) {
  const filePath = path.join(downloadRoot, asset.key);
  mkdirSync(path.dirname(filePath), { recursive: true });
  rmSync(filePath, { force: true });

  console.log(`[${index + 1}/${assets.length}] ${asset.key}`);

  const getResult = spawnSync(
    "npx",
    ["wrangler", "r2", "object", "get", `${bucket}/${asset.key}`, "--remote", "--file", filePath],
    { stdio: "inherit" }
  );
  if (getResult.status !== 0) {
    process.exit(getResult.status ?? 1);
  }

  const putResult = spawnSync(
    "npx",
    ["wrangler", "r2", "object", "put", `${bucket}/${asset.key}`, "--local", "--file", filePath, "--content-type", asset.mime, "--force"],
    { stdio: "inherit" }
  );
  if (putResult.status !== 0) {
    process.exit(putResult.status ?? 1);
  }
}

console.log("R2 remote to local sync complete.");
