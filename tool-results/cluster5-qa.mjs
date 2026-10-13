// temp QA script for cluster-5 (task 10-5) — link check + uniqueness
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "127.0.0.1", port: 3306, user: "grupos", password: "", database: "gruposwhatsapp", connectionLimit: 2,
});
const [rows] = await pool.query("SELECT id, slug, content FROM blog_posts ORDER BY id");
const mine = rows.filter((r) => /^post-12[3-8]$/.test(r.id));
console.log("my posts:", mine.map((r) => r.id).join(", "));

// 1) distinct internal URLs linked from cluster-5 content
const internalUrls = new Set();
for (const r of mine) {
  for (const m of r.content.matchAll(/\]\((\/[^)]+)\)/g)) internalUrls.add(m[1]);
}
console.log("distinct internal URLs in cluster-5:", internalUrls.size);
let bad = 0;
for (const u of [...internalUrls]) {
  const res = await fetch("http://localhost:3000" + u, { redirect: "manual" });
  if (res.status !== 200) { bad++; console.log("  BAD", u, res.status); }
}
console.log(bad === 0 ? "ALL INTERNAL LINKS 200 OK" : bad + " broken links");

// 2) paragraph-level uniqueness across ALL posts
const norm = (t) =>
  t.toLowerCase().replace(/[*_>#\[\]()"'’‘“”.,;:!?¿¡-]/g, " ").replace(/\s+/g, " ").trim();
const paras = new Map();
let dup = 0;
for (const r of rows) {
  for (const p of r.content
    .split(/\n\n+/)
    .map((x) => x.trim())
    .filter((x) => x && !x.startsWith("#") && !x.startsWith("|"))) {
    const n = norm(p);
    if (n.split(" ").length < 10) continue;
    if (paras.has(n)) { dup++; console.log("  DUP:", r.id, "vs", paras.get(n), "::", n.slice(0, 70)); }
    else paras.set(n, r.id);
  }
}
console.log("duplicate long paragraphs across all", rows.length, "posts:", dup);

// 3) required link matrix from task spec
const req = {
  "post-123": ["/blog/como-moderar-un-grupo-de-whatsapp-exitoso", "/blog/reglas-grupo-de-whatsapp-padres-de-familia", "/blog/reglas-grupo-de-whatsapp-vecinos", "/blog/reglas-grupos-de-whatsapp-trabajo-y-ventas"],
  "post-124": ["/blog/reglas-para-grupos-de-whatsapp-copiar-y-pegar"],
  "post-125": ["/blog/reglas-para-grupos-de-whatsapp-copiar-y-pegar", "/ciudad/madrid", "/ciudad/buenos-aires"],
  "post-126": ["/blog/reglas-para-grupos-de-whatsapp-copiar-y-pegar", "/categoria/compraventa", "/categoria/negocios", "/grupo/e-commerce-y-dropshipping-colombia"],
  "post-127": ["/categoria/humor", "/blog/descripciones-para-grupos-de-whatsapp"],
  "post-128": ["/blog/nombres-para-grupos-de-whatsapp-graciosos", "/agregar-grupo"],
};
for (const [id, urls] of Object.entries(req)) {
  const c = mine.find((r) => r.id === id).content;
  for (const u of urls) {
    if (!c.includes("](" + u + ")")) console.log("  MISSING in " + id + ":", u);
  }
}
console.log("required-link matrix checked");

await pool.end();
