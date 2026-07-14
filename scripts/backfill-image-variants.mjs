import { execFileSync } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DATABASE = "portfolio-db";
const BUCKET = "portfolio-media";
const WIDTHS = [640, 1280, 1920, 2560];
const WRANGLER = fileURLToPath(new URL("../node_modules/.bin/wrangler", import.meta.url));

export const parseBackfillArgs = (args) => {
  const dryRun = args.includes("--dry-run");
  const apply = args.includes("--apply");
  if (dryRun === apply) throw new Error("Choose exactly one of --dry-run or --apply");

  const remote = args.includes("--remote");
  const local = args.includes("--local");
  if (remote === local) throw new Error("Choose exactly one of --remote or --local");
  return { apply, remote };
};

const variantDimensions = (width, height, targetWidth) => ({
  width: Math.min(width, targetWidth),
  height: Math.max(1, Math.round((height / width) * Math.min(width, targetWidth)))
});

export const buildBackfillPlan = (asset, existingWidths) => {
  if (asset.mime === "image/gif" || !asset.width || !asset.height) return [];
  const targetWidths = [...new Set([...WIDTHS.filter((width) => width < asset.width), asset.width])]
    .filter((width) => width <= 2560)
    .sort((left, right) => left - right);
  return targetWidths
    .filter((width) => !existingWidths.has(width))
    .map((width) => ({ ...variantDimensions(asset.width, asset.height, width), estimatedBytes: Math.round(asset.size * (width / asset.width) ** 2 * 0.75) }));
};

export const resolveAssetDimensions = (asset, metadata) => {
  if (asset.width > 0 && asset.height > 0) return asset;
  const oriented = metadata.autoOrient ?? metadata;
  if (!(oriented.width > 0) || !(oriented.height > 0)) {
    throw new Error(`Unable to determine dimensions for asset ${asset.id}`);
  }
  return { ...asset, width: oriented.width, height: oriented.height };
};

const environmentFlag = (remote) => remote ? "--remote" : "--local";

const runWrangler = (args, options = {}) =>
  execFileSync(WRANGLER, args, {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    encoding: options.encoding ?? "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"]
  });

const queryD1 = (sql, remote) => {
  const output = runWrangler(["d1", "execute", DATABASE, environmentFlag(remote), "--command", sql, "--json"]);
  const parsed = JSON.parse(output);
  return parsed[0]?.results ?? parsed.results ?? [];
};

const executeD1 = (sql, remote) => {
  runWrangler(["d1", "execute", DATABASE, environmentFlag(remote), "--command", sql]);
};

const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;

const variantKey = (asset, width) => {
  const path = asset.r2_key.split("/");
  const year = /^\d{4}$/.test(path[1] ?? "") ? path[1] : "legacy";
  const month = /^\d{2}$/.test(path[2] ?? "") ? path[2] : "00";
  return `variants/${year}/${month}/${asset.id}-${width}w.webp`;
};

const loadState = (remote) => {
  const assets = queryD1(
    "SELECT id, r2_key, mime, width, height, size FROM assets ORDER BY created_at ASC",
    remote
  );
  const variants = queryD1("SELECT asset_id, width FROM asset_variants ORDER BY asset_id, width", remote);
  const widthsByAsset = new Map();
  for (const variant of variants) {
    const widths = widthsByAsset.get(variant.asset_id) ?? new Set();
    widths.add(variant.width);
    widthsByAsset.set(variant.asset_id, widths);
  }
  return { assets, widthsByAsset };
};

const uploadVariant = (key, filePath, remote) => {
  runWrangler([
    "r2", "object", "put", `${BUCKET}/${key}`, environmentFlag(remote), "--file", filePath,
    "--content-type", "image/webp"
  ]);
};

const deleteVariant = (key, remote) => {
  runWrangler(["r2", "object", "delete", `${BUCKET}/${key}`, environmentFlag(remote)]);
};

const inspectAsset = async (asset, remote, sharp) => {
  const directory = await mkdtemp(join(tmpdir(), "portfolio-inspect-"));
  const sourcePath = join(directory, basename(asset.r2_key) || `${asset.id}-source`);
  try {
    runWrangler(["r2", "object", "get", `${BUCKET}/${asset.r2_key}`, environmentFlag(remote), "--file", sourcePath]);
    return resolveAssetDimensions(asset, await sharp(sourcePath).metadata());
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};

const applyAssetPlan = async (asset, plan, remote, sharp) => {
  const directory = await mkdtemp(join(tmpdir(), "portfolio-variants-"));
  const sourcePath = join(directory, basename(asset.r2_key) || `${asset.id}-source`);
  const uploaded = [];

  try {
    runWrangler(["r2", "object", "get", `${BUCKET}/${asset.r2_key}`, environmentFlag(remote), "--file", sourcePath]);
    const records = [];
    for (const variant of plan) {
      const outputPath = join(directory, `${asset.id}-${variant.width}w.webp`);
      await sharp(sourcePath).rotate().resize({ width: variant.width, withoutEnlargement: true }).webp({ quality: 85 }).toFile(outputPath);
      const key = variantKey(asset, variant.width);
      uploadVariant(key, outputPath, remote);
      uploaded.push(key);
      const outputSize = (await stat(outputPath)).size;
      records.push({ ...variant, key, size: outputSize });
    }

    const statements = [
      `UPDATE assets SET width = ${asset.width}, height = ${asset.height} WHERE id = ${sqlString(asset.id)}`,
      ...records.map((record) =>
      `INSERT OR IGNORE INTO asset_variants (asset_id, width, height, r2_key, mime, size) VALUES (` +
      `${sqlString(asset.id)}, ${record.width}, ${record.height}, ${sqlString(record.key)}, 'image/webp', ${record.size})`
      )
    ];
    executeD1(`${statements.join(";\n")};`, remote);
    return records.reduce((total, record) => total + record.size, 0);
  } catch (error) {
    for (const key of uploaded) {
      try {
        deleteVariant(key, remote);
      } catch {
        // Preserve the primary error; a later idempotent run can clean up or overwrite this key.
      }
    }
    throw error;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};

export const runBackfill = async (args = process.argv.slice(2)) => {
  const { apply, remote } = parseBackfillArgs(args);
  const { assets, widthsByAsset } = loadState(remote);
  const needsInspection = assets.some((asset) => !(asset.width > 0) || !(asset.height > 0));
  const { default: sharp } = needsInspection || apply ? await import("sharp") : { default: null };
  const resolvedAssets = [];
  for (const [index, asset] of assets.entries()) {
    if (asset.mime === "image/gif") {
      resolvedAssets.push(asset);
      continue;
    }
    if (asset.width > 0 && asset.height > 0) {
      resolvedAssets.push(asset);
      continue;
    }
    console.log(`[inspect ${index + 1}/${assets.length}] ${asset.r2_key}`);
    resolvedAssets.push(await inspectAsset(asset, remote, sharp));
  }

  const planned = resolvedAssets.map((asset) => ({
    asset,
    variants: buildBackfillPlan(asset, widthsByAsset.get(asset.id) ?? new Set())
  })).filter(({ variants }) => variants.length > 0);
  const projectedBytes = planned.flatMap(({ variants }) => variants).reduce((total, variant) => total + variant.estimatedBytes, 0);

  console.log(`${apply ? "APPLY" : "DRY RUN"} ${remote ? "remote" : "local"}: ${planned.length} assets, ${planned.reduce((total, item) => total + item.variants.length, 0)} variants, ~${projectedBytes} bytes projected`);
  if (!apply) return;

  let writtenBytes = 0;
  for (const [index, item] of planned.entries()) {
    console.log(`[${index + 1}/${planned.length}] ${item.asset.r2_key}`);
    writtenBytes += await applyAssetPlan(item.asset, item.variants, remote, sharp);
  }
  console.log(`Completed: ${writtenBytes} bytes written; original objects unchanged.`);
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  runBackfill().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
