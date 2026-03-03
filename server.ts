import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Proxy for Evolution API to avoid CORS issues
  app.all("/api/evo-proxy-v2", async (req, res) => {
    const { url, key, method, data, endpoint } = req.method === 'POST' ? req.body : req.query;

    console.log(`[Proxy V2] Received request: ${req.method} ${endpoint} to ${url}`);

    if (req.method === 'GET' && !url) {
      return res.json({ status: "ok", message: "Proxy V2 is alive" });
    }

    if (!url || !key || !endpoint) {
      console.error("[Proxy V2] Missing required fields:", { url: !!url, key: !!key, endpoint: !!endpoint });
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const baseUrl = url.trim().replace(/\/$/, "");
      const fullUrl = `${baseUrl}${endpoint}`;
      
      const config: any = {
        url: fullUrl,
        method: method || req.method || "GET",
        headers: {
          "apikey": key,
          "Content-Type": "application/json"
        },
        timeout: 30000 // Increased timeout
      };

      if (config.method.toUpperCase() !== "GET" && data) {
        config.data = data;
      }

      const response = await axios(config);
      console.log(`[Proxy V2] Success: ${response.status} from ${fullUrl}`);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const errorData = error.response?.data || { error: error.message };
      console.error(`[Proxy V2] Error ${status}:`, errorData);
      res.status(status).json(errorData);
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
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
