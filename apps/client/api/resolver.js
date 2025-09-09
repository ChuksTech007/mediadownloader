// Simple Vercel / Netlify serverless handler (Node 18+ environment assumed)
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "Missing url" });

  try {
    const parsed = new URL(url);
    // allow-list: change to your safe hosts
    const ALLOW = ["example.com", "cdn.yoursite.com"];
    if (!ALLOW.some(h => parsed.hostname === h || parsed.hostname.endsWith("." + h))) {
      return res.status(400).json({ error: "Domain not allowed" });
    }

    // Try HEAD first to be fast and lightweight
    const head = await fetch(url, { method: "HEAD", redirect: "follow" });
    const type = head.headers.get("content-type") || "";
    const size = head.headers.get("content-length");

    let title = parsed.hostname;
    let thumb = null;

    // If HTML page, fetch HTML and try to extract OG tags (best-effort)
    if (type.includes("text/html")) {
      try {
        const html = await (await fetch(url, { method: "GET", redirect: "follow" })).text();
        const t = html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1];
        const i = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1];
        if (t) title = t;
        if (i) thumb = i;
      } catch (e) {
        // fail silently
      }
    }

    const option = {
      label: "Original",
      mime: type,
      bytes: size ? Number(size) : null,
      href: url
    };

    // Cache control for CDN (important for performance)
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");
    return res.status(200).json({ title, thumb, options: [option] });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to resolve URL" });
  }
}
