import mysql from "mysql2/promise";
const pool = mysql.createPool({ host:"127.0.0.1", port:3306, user:"grupos", password:"", database:"gruposwhatsapp", connectionLimit:2 });
const [rows] = await pool.query("SELECT id, content FROM blog_posts");
await pool.end();
const norm = (s) => s.replace(/[\s«»"'*#|>-]/g, "").toLowerCase();
const paras = [];
for (const r of rows) {
  for (const p of r.content.split(/\n{2,}/)) {
    const t = p.trim();
    if (t.length >= 80) paras.push({ id: r.id, key: norm(t), preview: t.slice(0, 70) });
  }
}
const byKey = new Map();
for (const p of paras) {
  if (!byKey.has(p.key)) byKey.set(p.key, []);
  byKey.get(p.key).push(p.id);
}
let dup = 0;
for (const [key, ids] of byKey) {
  const uniq = [...new Set(ids)];
  if (uniq.length > 1) {
    const mine = uniq.filter((i) => i >= "post-134" && i <= "post-138");
    if (mine.length) { dup++; console.log("DUP across posts:", uniq.join(", "), "«" + paras.find((p) => p.key === key).preview + "»"); }
  }
}
console.log(dup === 0 ? "UNIQUENESS OK: no shared paragraph (>80 chars) between cluster-7 posts and any other post" : dup + " shared paragraphs found");
console.log("total posts in DB:", rows.length);
