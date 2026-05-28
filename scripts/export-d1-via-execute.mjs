import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const databaseName = process.argv[2] ?? "portfolio-db";
const outputPath = process.argv[3] ?? "d1-backups/remote-prod-2026-05-27.sql";

const tables = [
  { name: "assets", orderBy: "created_at, id" },
  { name: "profile", orderBy: "id" },
  { name: "timeline_items", orderBy: "sort_order, created_at, id" },
  { name: "works", orderBy: "sort_order, created_at, id" },
  { name: "work_blocks", orderBy: "sort_order, id" },
  { name: "d1_migrations", orderBy: "id" }
];

const runWranglerJson = (command) => {
  const result = spawnSync(
    "npx",
    ["wrangler", "d1", "execute", databaseName, "--remote", "--command", command, "--json"],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.stderr.write(result.stdout);
    process.exit(result.status ?? 1);
  }

  return JSON.parse(result.stdout)[0]?.results ?? [];
};

const quoteIdentifier = (value) => `"${String(value).replaceAll('"', '""')}"`;

const quoteValue = (value) => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
};

const lines = [
  "PRAGMA foreign_keys=OFF;",
  "BEGIN TRANSACTION;",
  'DELETE FROM "work_blocks";',
  'DELETE FROM "works";',
  'DELETE FROM "timeline_items";',
  'DELETE FROM "profile";',
  'DELETE FROM "assets";',
  'DELETE FROM "d1_migrations";'
];

for (const table of tables) {
  const rows = runWranglerJson(`SELECT * FROM ${quoteIdentifier(table.name)} ORDER BY ${table.orderBy}`);

  for (const row of rows) {
    const columns = Object.keys(row);
    const columnSql = columns.map(quoteIdentifier).join(",");
    const valueSql = columns.map((column) => quoteValue(row[column])).join(",");
    lines.push(`INSERT INTO ${quoteIdentifier(table.name)} (${columnSql}) VALUES(${valueSql});`);
  }
}

lines.push("COMMIT;");
lines.push("PRAGMA foreign_keys=ON;");
lines.push("");

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, lines.join("\n"));

console.log(`Wrote ${outputPath}`);
