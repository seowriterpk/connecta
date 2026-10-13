import mysql from "mysql2/promise";
const pool = mysql.createPool({ host:"127.0.0.1", port:3306, user:"grupos", password:"", database:"gruposwhatsapp", connectionLimit:2 });
const [rows] = await pool.query("SELECT id, content FROM blog_posts WHERE id IN ('post-134','post-135','post-136','post-137','post-138') ORDER BY id");
await pool.end();
for (const r of rows) {
  const links = [...r.content.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
  const internal = links.filter((l) => l.startsWith("/"));
  const external = links.filter((l) => l.startsWith("https://"));
  const dup = internal.filter((l, i) => internal.indexOf(l) !== i);
  console.log(`${r.id}: internal=${internal.length} external=${external.length} dupInternal=${dup.length ? dup.join(",") : "none"}`);
}
