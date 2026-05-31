import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());
  app.use(cors());

  // --- 🛡️ PROXY OFICIAL DA EVOLUTION API ---
  app.post("/api/evo-proxy-v2", async (req, res) => {
    console.log("🚀 [Evolution Proxy] Chamada recebida.");
    const { url, key, method, data, endpoint } = req.body || {};

    try {
      let baseUrl = url.trim().replace(/\/$/, "");
      const targetUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

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

      return res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error("❌ Erro no Proxy Evolution:", error.message);
      return res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
  });

  // --- 📊 ENDPOINT DE HISTÓRICO PARA O DASHBOARD (RECONSTRUÍDO DO ZERO) ---
  app.get("/api/trade-history", async (req, res) => {
    console.log("📊 [Axiom Engine] Requisição de histórico interceptada com sucesso!");

    const SUPABASE_URL = "https://xzlotpwqpdjwzqerdyfb.supabase.co/rest/v1/trade_history?order=timestamp.desc";
    const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bG90cHdxcGRqd3pxZXJkeWZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTk4MTkwNn0.InJlZ2li6Inh6bG90cHdxcGRqd3pxZXJkeWZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTk4MTkwNn0";

    try {
      const respostaSupabase = await axios.get(SUPABASE_URL, {
        headers: {
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      });

      console.log(`✅ Dados recuperados do Supabase! Total de registros: ${respostaSupabase.data?.length}`);

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json(respostaSupabase.data);

    } catch (error: any) {
      console.error("❌ Erro ao conectar ao Supabase via Backend:", error.message);
      return res.status(500).json({ error: "Falha na ponte de dados interna Axiom" });
    }
  });

  // --- ⚡ MIDDLEWARES DO VITE SPA ---
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log("====================================================");
    console.log("✅ MAESTRO AXIOM: SISTEMA RECONSTRUÍDO E INTEGRADO");
    console.log("🔗 Rota Evolution: /api/evo-proxy-v2");
    console.log("📊 Rota Histórico: /api/trade-history");
    console.log("====================================================");
  });
}

startServer();