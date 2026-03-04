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
  app.all(["/api/evo-proxy-v2", "/api/evo-proxy-v2/"], async (req, res) => {
    // Add a header to identify that the response came through our proxy
    res.setHeader('X-Proxy-Source', 'WayAxiom-Proxy-V2');

    // If it's a GET request to the proxy root without a URL query, just return status
    if (req.method === 'GET' && !req.query.url && !req.body?.url) {
      console.log(`[Proxy V2] Status check from ${req.ip}`);
      return res.json({ 
        status: "ok", 
        message: "Proxy V2 is active and waiting for requests",
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
      // Normalize URL: ensure protocol and remove trailing slash
      let baseUrl = url.trim();
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
      baseUrl = baseUrl.replace(/\/$/, "");
      
      // Normalize endpoint: ensure leading slash
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const fullUrl = `${baseUrl}${cleanEndpoint}`;
      
      console.log(`[Proxy V2] 🚀 Forwarding ${method || 'GET'} to: ${fullUrl}`);
      console.log(`[Proxy V2] 🔑 Using API Key: ${key.substring(0, 4)}...${key.substring(key.length - 4)}`);
      
      const config: any = {
        url: fullUrl,
        method: (method || "GET").toUpperCase(),
        headers: {
          "apikey": key,
          "api-key": key,
          "Authorization": `Bearer ${key}`,
          "Accept": "application/json"
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status: number) => status < 500 // Allow 4xx to be handled in the success block if needed, but catch will still get them if we want
      };

      // Only add Content-Type if there is a body
      if (config.method !== "GET" && data) {
        config.headers["Content-Type"] = "application/json";
        config.data = data;
      }

      const response = await axios(config);
      console.log(`[Proxy V2] Response: ${response.status} from ${fullUrl}`);
      
      if (response.status === 405) {
        console.error(`[Proxy V2] ❌ 405 Method Not Allowed from target!`);
        console.error(`[Proxy V2] Method used: ${config.method}`);
        console.error(`[Proxy V2] URL: ${fullUrl}`);
        console.error(`[Proxy V2] Response data:`, JSON.stringify(response.data));
        
        // Add a hint if it's a 405
        if (typeof response.data === 'object') {
          response.data.hint = "O servidor Evolution retornou 405 (Método não permitido). Isso geralmente significa que a URL está incompleta (falta o /v2) ou o endpoint mudou nesta versão da API.";
        }
      }
      
      res.status(response.status).json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      let errorData = error.response?.data || { error: error.message };
      
      // Handle 428 Precondition Required (Common in Evolution v2 when instance is not ready)
      if (status === 428) {
        console.warn(`[Proxy V2] ⚠️ Evolution returned 428: Instance not ready or connection closed.`);
        if (typeof errorData === 'object') {
          errorData.hint = "A instância está em estado de transição (reconectando ou inicializando). Aguarde alguns segundos.";
        }
      }
      
      // Handle DNS errors specifically
      if (error.code === 'EAI_AGAIN' || error.code === 'ENOTFOUND') {
        console.error(`[Proxy V2] 🌐 DNS Error: Could not resolve hostname "${url}"`);
        errorData = { 
          error: "Erro de DNS: Não foi possível encontrar o servidor.", 
          details: error.message,
          hint: "Verifique se a URL da Instância está correta. Ela deve ser um endereço web válido (ex: https://api.seu-servidor.com). O que você digitou não parece ser um endereço válido."
        };
      }
      
      // If errorData is a string (like an HTML 404 page), wrap it
      if (typeof errorData === 'string') {
        console.warn(`[Proxy V2] Received non-JSON error from target: ${errorData.substring(0, 100)}...`);
        errorData = { error: "Target returned non-JSON response", details: errorData.substring(0, 200) };
      }

      console.error(`[Proxy V2] ❌ Error ${status} from ${url}:`, JSON.stringify(errorData).substring(0, 200));
      
      // Add helpful hints for common errors
      if (status === 404 && !errorData.hint) {
        errorData.hint = "Verifique se a URL da API está correta (incluindo /v2 se necessário) e se o nome da instância existe.";
      } else if (status === 405 && !errorData.hint) {
        errorData.hint = "O método HTTP usado não é permitido para este endpoint. Verifique se a URL da instância precisa do sufixo /v2 (ex: https://api.seu-servidor.com/v2).";
      } else if ((status === 403 || status === 401) && !errorData.hint) {
        errorData.hint = "Verifique se a API Key (Global ou da Instância) está correta e tem permissões.";
      }

      res.status(status).json(errorData);
    }
  });

  // Catch-all for API routes to prevent falling through to SPA fallback
  app.all("/api/*", (req, res) => {
    console.warn(`[Server] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "Rota da API não encontrada", 
      path: req.url,
      hint: "Verifique se a URL da API está correta." 
    });
  });

  // Vite middleware for development
  // In this environment, we always want to use Vite middleware to ensure the latest code is served
  const isDev = process.env.NODE_ENV !== "production" || true; // Force true for now to fix the blank screen
  
  if (isDev) {
    console.log("[Server] Starting in DEVELOPMENT mode with Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Starting in PRODUCTION mode serving from dist");
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================================");
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
    console.log(`🔗 PROXY READY AT /api/evo-proxy-v2`);
    console.log(`🛠️  ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log("=================================================");
  });
}

startServer();
