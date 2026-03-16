import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());
  app.use(cors());

  // ROTA CORRIGIDA PARA BATER COM O SEU FRONT-END
  app.post("/api/evo-proxy-v2", async (req, res) => {
    console.log("🚀 Recebi uma chamada no Proxy!"); // Log para teste
    const { url, key, method, data, endpoint } = req.body || {};

    try {
      let baseUrl = url.trim().replace(/\/$/, "");
      // Se a URL não tiver /v2 e for necessário, o proxy ajusta
      const targetUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

      console.log(`📡 Encaminhando para: ${targetUrl}`);

      const response = await axios({
        url: targetUrl,
        method: (method || "GET").toUpperCase(),
        headers: {
          "apikey": key,
          "Accept": "*/*",
          "Content-Type": "application/json"
        },
        data: data || {},
        timeout: 15000
      });

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error("❌ Erro no Proxy:", error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log("✅ MAESTRO AXIOM: PROXY ATIVO EM /api/evo-proxy-v2");
    console.log("🔗 URL: http://localhost:3001");
  });
}

startServer();