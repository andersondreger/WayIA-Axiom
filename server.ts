import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());
  app.use(cors());

  // 1. SEU PROXY DA EVOLUTION API
  app.post("/api/evo-proxy-v2", async (req, res) => {
    // ... seu código do proxy mantido intacto ...
  });

  // 2. ENDPOINT DE HISTÓRICO (Forçado estritamente antes do Vite)
  app.get("/api/trade-history", async (req, res) => {
    console.log("📊 [Axiom Backend] Requisição de histórico interceptada com sucesso!");

    const SUPABASE_URL = "https://xzlotpwqpdjwzqerdyfb.supabase.co/rest/v1/trade_history?order=timestamp.desc";
    const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bG90cHdxcGRqd3pxZXJkeWZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxNzAyMSwiZXhwIjoyMDg3ODkzMDIxfQ.61am9-3Am8PhNx2XXnLrr20vBIELj6hPo7tDLXT0DhQ";

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

      // Desativa qualquer tipo de cache para garantir que a Cloudflare entregue dados novos
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      // Retorna os dados puros obtidos da tabela do Supabase
      return res.status(200).json(respostaSupabase.data);

    } catch (error: any) {
      console.error("❌ Erro na comunicação com o Supabase:", error.message);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        error: "Erro na conexão interna",
        detalhes: error.message
      });
    }
  });

  // 3. MIDDLEWARES DO VITE (Sempre no final do arquivo, capturando o que sobra)
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Servidor Maestro Axiom operando de forma integrada na porta ${PORT}!`);
  });
}

startServer();