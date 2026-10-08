import { SITE } from "@/lib/constants";
import { getNewestGroupsForRss } from "@/lib/data";
import { getPublishedPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

// 1 hour ISR cache + Cache-Control header on the response.

const RSS_LIMIT = 50;

/** Escape special XML characters in text content (not attributes). */
function xmlEscape(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Trim + collapse whitespace for description fields. */
function normalize(text: string | null | undefined, max = 320): string {
  if (!text) return "";
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  return collapsed.slice(0, max - 1).trimEnd() + "…";
}

function toRfc822(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

export async function GET() {
  const [groups, posts] = await Promise.all([
    getNewestGroupsForRss(RSS_LIMIT),
    getPublishedPosts(10),
  ]);
  const selfUrl = `${SITE.url}/rss`;
  const buildDate = new Date().toUTCString();

  const itemsXml = groups
    .map((g) => {
      const groupUrl = `${SITE.url}/grupo/${g.slug}`;
      const title = xmlEscape(g.title);
      const description = xmlEscape(
        normalize(g.description, 320) ||
          `${g.title} — grupo de WhatsApp en español en ConectaGrupos.`
      );
      const category = g.category?.name ? xmlEscape(g.category.name) : "";
      const pubDate = toRfc822(g.createdAt);
      const country = g.country?.name ? xmlEscape(g.country.name) : "";
      const authorName = g.uploaderName ? xmlEscape(g.uploaderName) : SITE.author;

      return `    <item>
      <title>${title}</title>
      <link>${xmlEscape(groupUrl)}</link>
      <guid isPermaLink="true">${xmlEscape(groupUrl)}</guid>
      <description>${description}</description>
      ${category ? `<category>${category}</category>\n      ` : ""}<author>${authorName}</author>
      ${country ? `<source url="${xmlEscape(SITE.url)}">${xmlEscape(SITE.name)}</source>\n      ` : ""}<pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  // Blog posts — newest first, mixed into the feed (guid = canonical URL).
  const blogItemsXml = posts
    .map((p) => {
      const postUrl = `${SITE.url}/blog/${p.slug}`;
      return `    <item>
      <title>${xmlEscape(p.title)}</title>
      <link>${xmlEscape(postUrl)}</link>
      <guid isPermaLink="true">${xmlEscape(postUrl)}</guid>
      <description>${xmlEscape(normalize(p.excerpt, 320))}</description>
      <category>Blog</category>
      <author>${xmlEscape(p.authorName)}</author>
      <pubDate>${toRfc822(p.publishedAt ?? p.createdAt)}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(SITE.name)} — Grupos de WhatsApp en español</title>
    <link>${xmlEscape(SITE.url)}</link>
    <description>${xmlEscape(SITE.description)}</description>
    <language>es-ES</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <ttl>60</ttl>
    <generator>ConectaGrupos RSS 1.0</generator>
    <managingEditor>${xmlEscape(SITE.contactEmail)} (${xmlEscape(SITE.author)})</managingEditor>
    <webMaster>${xmlEscape(SITE.contactEmail)} (${xmlEscape(SITE.author)})</webMaster>
    <image>
      <url>${xmlEscape(SITE.url)}/favicon.svg</url>
      <title>${xmlEscape(SITE.name)}</title>
      <link>${xmlEscape(SITE.url)}</link>
      <width>64</width>
      <height>64</height>
      <description>${xmlEscape(SITE.tagline)}</description>
    </image>
    <atom:link href="${xmlEscape(selfUrl)}" rel="self" type="application/rss+xml" />
    <atom:link href="${xmlEscape(SITE.url)}/sitemap.xml" rel="related" type="application/xml" />
${itemsXml}
${blogItemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=UTF-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
