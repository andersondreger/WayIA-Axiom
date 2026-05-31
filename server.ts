// --- 📊 ENDPOINT DE HISTÓRICO PARA O DASHBOARD (CORRIGIDO) ---
app.get("/api/trade-history", async (req, res) => {
  console.log("📊 Dashboard solicitou o histórico de trades do Supabase!");

  const SUPABASE_URL = "https://xzlotpwqpdjwzqerdyfb.supabase.co/rest/v1/trade_history?order=timestamp.desc";
  const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bG90cHdxcGRqd3pxZXJkeWZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxNzAyMSwiZXhwIjoyMDg3ODkzMDIxfQ.61am9-3Am8PhNx2XXnLrr20vBIELj6hPo7tDLXT0DhQ";

  try {
    const respostaSupabase = await axiom.get(SUPABASE_URL, {
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json" // 🟢 Corrigido de "application/json/icon" para o padrão
      },
      timeout: 10000
    });

    // Libera explicitamente as permissões de leitura para o navegador ler os dados sem travar no CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    return res.status(200).json(respostaSupabase.data);
  } catch (error: any) {
    console.error("❌ Erro ao buscar dados do Supabase no Backend:", error.message);
    return res.status(500).json({ error: "Falha na ponte Antigravity -> Supabase" });
  }
});