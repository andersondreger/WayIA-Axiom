import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Global logger to debug requests
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API Request] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    }
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: process.env.NODE_ENV || 'development' });
  });

  // Simple test route
  app.get("/api/test-proxy", (req, res) => {
    console.log("[Proxy V2] Test route hit");
    res.json({ status: "ok", message: "Proxy endpoint is reachable" });
  });

  // Proxy for Evolution API to avoid CORS issues
  app.all("/api/evo-proxy-v2*", async (req, res) => {
    console.log(`[Proxy V2] 📥 Request: ${req.method} ${req.url}`);

    res.setHeader('X-Proxy-Source', 'WayAxiom-Proxy-V2');

    if (req.method === 'GET' && !req.query.url && !req.body?.url) {
      return res.json({
        status: "ok",
        message: "Proxy V2 is active",
        timestamp: new Date().toISOString()
      });
    }

    const { url, key, method, data, endpoint } = req.body || {};

    console.log(`[Proxy V2] Received request: ${req.method} ${endpoint} to ${url}`);

    if (req.method === 'GET' && !url) {
      return res.json({ status: "ok", message: "Proxy V2 is alive" });
    }

    if (!url || !key || !endpoint) {
      console.error("[Proxy V2] Missing required fields:", { url: !!url, key: !!key, endpoint: !!endpoint });
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // --- AJUSTE CIRÚRGICO DE ENGENHARIA ---
      let baseUrl = url.trim();
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
      baseUrl = baseUrl.replace(/\/$/, "");

      // Força a rota v2
      if (!baseUrl.endsWith('/v2')) {
        baseUrl = `${baseUrl}/v2`;
      }

      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const fullUrl = `${baseUrl}${cleanEndpoint}`;

      console.log(`[Proxy V2] 🚀 Forwarding ${method || 'POST'} to: ${fullUrl}`);

      const config: any = {
        url: fullUrl,
        method: (method || "POST").toUpperCase(), // Força POST para evitar 405 em criações
        headers: {
          "apikey": key,
          "Accept": "*/*", // Aceita qualquer retorno para evitar bloqueios de formato
          "Content-Type": "application/json"
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status: number) => status < 500
      };

      // Garante que o data não vá vazio se for um POST/PUT
      if (config.method !== "GET") {
        config.data = data || {};
      }

      const response = await axios(config);
      console.log(`[Proxy V2] Response: ${response.status} from ${fullUrl}`);

      if (response.status === 405) {
        console.error(`[Proxy V2] ❌ Erro 405 ainda persiste em: ${fullUrl}`);
      }

      res.status(response.status).json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      let errorData = error.response?.data || { error: error.message };

      res.status(status).json(errorData);
    }
  });

  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "Rota da API não encontrada" });
  });

  const isDev = process.env.NODE_ENV !== "production" || true;

  if (isDev) {
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
    console.log("=================================================");
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
    console.log(`🔗 PROXY READY AT /api/evo-proxy-v2`);
    console.log("=================================================");
  });
}

startServer();