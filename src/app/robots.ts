import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /media/   — locally stored WhatsApp group images (user directive:
        //             Google must never index these images).
        // /uploads/  — legacy image folder (pre-policy local images) — same rule.
        // /api/img  — image proxy (defense in depth on top of X-Robots-Tag).
        disallow: ["/api/", "/admin/", "/_next/", "/media/", "/uploads/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
