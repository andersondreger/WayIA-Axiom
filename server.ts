import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());
  app.use(cors());

  // --- 🛡️ MANTIDO: SEU PROXY OFICIAL DA EVOLUTION API ---
  app.post("/api/evo-proxy-v2", async (req, res) => {
    console.log("🚀 Recebi uma chamada no Proxy!");
    const { url, key, method, data, endpoint } = req.body || {};

    try {
      let baseUrl = url.trim().replace(/\/$/, "");
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


  // --- 📊 ACRESCENTADO: ENDPOINT DE HISTÓRICO PARA O DASHBOARD ---
  app.get("/api/trade-history", async (req, res) => {
    console.log("📊 Dashboard solicitou o histórico de trades do Supabase!");

    const SUPABASE_URL = "https://xzlotpwqpdjwzqerdyfb.supabase.co/rest/v1/trade_history?order=timestamp.desc";

    // Chave secreta de serviço que validamos direto da VPS para ignorar o CORS no navegador
    const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bG90cHdxcGRqd3pxZXJkeWZiIiwicm9sZSI6InlseXZlX3JvbGUiLCJpYXQiOjE3MzE5ODE5MDZ9...";

    try {
      const respostaSupabase = await axios.get(SUPABASE_URL, {
        headers: {
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      });

      // Retorna o array de dados puro e limpo para o ApexCharts renderizar
      res.status(200).json(respostaSupabase.data);
    } catch (error: any) {
      console.error("❌ Erro ao buscar dados do Supabase no Backend:", error.message);
      res.status(error.response?.status || 500).json({ error: "Falha na ponte Antigravity -> Supabase" });
    }
  });


  // --- ⚡ MANTIDO: MIDDLEWARES DO VITE SPA ---
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log("✅ MAESTRO AXIOM: PROXY ATIVO EM /api/evo-proxy-v2");
    console.log("📊 MAESTRO AXIOM: ENDPOINT DE SINAIS ATIVO EM /api/trade-history");
    console.log("🔗 URL: http://localhost:3001");
  });
}

startServer();