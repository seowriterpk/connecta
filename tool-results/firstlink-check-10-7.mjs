import mysql from "mysql2/promise";
const pool = mysql.createPool({ host:"127.0.0.1", port:3306, user:"grupos", password:"", database:"gruposwhatsapp", connectionLimit:2 });
const [rows] = await pool.query("SELECT id, content FROM blog_posts WHERE id IN ('post-134','post-135','post-136','post-137','post-138') ORDER BY id");
await pool.end();
for (const r of rows) {
  const m = r.content.match(/\]\((\/[a-z0-9/-]*)\)/);
  const idx = m ? m.index : -1;
  const words = idx >= 0 ? r.content.slice(0, idx).split(/\s+/).filter(Boolean).length : -1;
  console.log(`${r.id}: first internal link ${m?.[1] ?? "NONE"} at word ${words} ${words >= 0 && words <= 150 ? "OK" : "PROBLEM"}`);
}
