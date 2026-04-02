import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to resolve Google Photos / Drive links
  app.get("/api/resolve-link", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      // Use built-in fetch (Node 18+)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        redirect: 'follow'
      });

      const html = await response.text();
      const finalUrl = response.url;

      // Extract og:image (usually the direct link to the image/thumbnail)
      const ogImageMatch = html.match(/property="og:image" content="([^"]+)"/);
      const ogVideoMatch = html.match(/property="og:video" content="([^"]+)"/);
      const twitterVideoMatch = html.match(/name="twitter:player:stream" content="([^"]+)"/);
      
      // Look for the "lh3.googleusercontent.com" pattern which is the direct source
      const lh3Match = html.match(/https:\/\/lh3\.googleusercontent\.com\/[a-zA-Z0-9_-]+/);
      
      // Also look for direct video source in script tags if og:video is missing
      const videoSrcMatch = html.match(/"(https:\/\/video-downloads\.googleusercontent\.com\/[^"]+)"/);

      res.json({
        originalUrl: url,
        finalUrl: finalUrl,
        ogImage: ogImageMatch ? ogImageMatch[1] : (lh3Match ? lh3Match[0] : null),
        ogVideo: ogVideoMatch ? ogVideoMatch[1] : (twitterVideoMatch ? twitterVideoMatch[1] : (videoSrcMatch ? videoSrcMatch[1].replace(/\\u003d/g, '=').replace(/\\u0026/g, '&') : null)),
      });
    } catch (error) {
      console.error('Error resolving link:', error);
      res.status(500).json({ error: 'Failed to resolve link' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
