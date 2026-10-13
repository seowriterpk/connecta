// Task 8-b QA helper: GFM table render test on the live blog post.
// 1. Backup the original content (exact bytes) to tool-results.
// 2. Append a small markdown table.
// Usage: bun tool-results/gfm-table-test.mjs backup|append-table|restore
import mysql from "mysql2/promise";
import { readFileSync, writeFileSync } from "node:fs";

const SLUG = "como-encontrar-grupos-de-whatsapp-seguros-2026";
const BACKUP = "/home/z/my-project/tool-results/blog-001-content-backup.md";

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "grupos",
  password: "",
  database: "gruposwhatsapp",
  charset: "utf8mb4",
});

const mode = process.argv[2];

if (mode === "backup") {
  const [rows] = await pool.query("SELECT `content` FROM `blog_posts` WHERE `slug` = ? LIMIT 1", [SLUG]);
  const content = rows[0].content;
  writeFileSync(BACKUP, content, "utf8");
  console.log("backup ok, chars:", Buffer.byteLength(content, "utf8"));
} else if (mode === "append-table") {
  const [rows] = await pool.query("SELECT `content` FROM `blog_posts` WHERE `slug` = ? LIMIT 1", [SLUG]);
  const table = `\n\n## Prueba de tabla GFM (temporal)\n\n| Criterio | Grupo grande | Grupo pequeño |\n| --- | --- | --- |\n| Ruido | Más mensajes | Conversación tranquila |\n| Contacto | Menos personal | Más cercano |\n\n~~texto tachado de prueba~~\n`;
  const next = rows[0].content + table;
  await pool.query("UPDATE `blog_posts` SET `content` = ? WHERE `slug` = ?", [next, SLUG]);
  console.log("table appended, chars now:", Buffer.byteLength(next, "utf8"));
} else if (mode === "restore") {
  const original = readFileSync(BACKUP, "utf8");
  const [res] = await pool.query("UPDATE `blog_posts` SET `content` = ? WHERE `slug` = ?", [original, SLUG]);
  const [rows] = await pool.query("SELECT `content` FROM `blog_posts` WHERE `slug` = ? LIMIT 1", [SLUG]);
  const ok = rows[0].content === original;
  console.log("restored, rows:", res.affectedRows, "content identical to backup:", ok, "bytes:", Buffer.byteLength(rows[0].content, "utf8"));
} else {
  console.log("unknown mode");
}

await pool.end();
