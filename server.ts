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
  app.post("/api/evolution-proxy", async (req, res) => {
    const { url, key, method, data, endpoint } = req.body;

    if (!url || !key || !endpoint) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const baseUrl = url.trim().replace(/\/$/, "");
      const fullUrl = `${baseUrl}${endpoint}`;
      
      console.log(`Proxying ${method} request to ${fullUrl}`);

      const config: any = {
        url: fullUrl,
        method: method || "GET",
        headers: {
          "apikey": key,
          "Content-Type": "application/json"
        },
        timeout: 15000
      };

      if (method && method.toUpperCase() !== "GET" && data) {
        config.data = data;
      }

      const response = await axios(config);

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error("Proxy error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
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
