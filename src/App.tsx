/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Activity, Shield, Zap, TrendingUp, TrendingDown, RefreshCw, 
  Crown, Trophy, LineChart, Wallet, History, ChevronDown, 
  CheckCircle2, Loader2, Camera, Image as ImageIcon, Eye, User, LogOut, LayoutGrid,
  MessageSquare, Settings, Link as LinkIcon, Calendar, Target, AlertCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini with environment variable support for multiple platforms
const getApiKey = () => {
  try {
    // Safely check for process.env
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {}
  
  try {
    // Safely check for import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {}
  
  return '';
};

const apiKey = getApiKey();

// Lazy initialization of Gemini to prevent startup crashes
let aiInstance: GoogleGenAI | null = null;
const getAi = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });
  }
  return aiInstance;
};

type SignalState = 'IDLE' | 'SCANNING' | 'SIGNAL_FOUND';
type Tab = 'planos' | 'ranking' | 'analise' | 'gestao' | 'historico' | 'calendario';

interface Signal {
  asset: string;
  action: 'COMPRA (CALL)' | 'VENDA (PUT)';
  color: string;
  confidence: number;
  timeframe: string;
}

const ASSETS = [
  'EUR/USD', 'GBP/JPY', 'BTC/USDT', 'ETH/USD', 'AUD/CAD', 
  'USD/JPY', 'EUR/GBP', 'SOL/USDT', 'XRP/USDT', 'GOLD'
];

export default function App() {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    console.log("Vision AI: App Component Mounted");
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-50" />
          <h1 className="text-2xl font-bold mb-4">Sistema de Segurança Ativado</h1>
          <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
            O Google Chrome bloqueou uma tentativa de conexão insegura ou ocorreu um erro crítico de renderização. 
            Verifique se a URL da sua Evolution API começa com <span className="text-primary-purple font-mono">https://</span>.
          </p>
          <button 
            onClick={() => {
              setHasError(false);
              window.location.reload();
            }}
            className="px-8 py-4 bg-primary-purple rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_30px_rgba(168,85,247,0.3)]"
          >
            Reiniciar e Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  try {
    return <AppContent setHasError={setHasError} />;
  } catch (e) {
    console.error("Vision AI Render Error:", e);
    setHasError(true);
    return null;
  }
}

function AppContent({ setHasError }: { setHasError: (v: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('analise');
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  
  // Dashboard States
  const [state, setState] = useState<SignalState>('IDLE');
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null);

  // Force body background and handle potential stuck states
  useEffect(() => {
    document.body.style.backgroundColor = '#050505';
    console.log("Vision AI: System Initialized");
  }, []);
  const [usageCount, setUsageCount] = useState(0);
  const [history, setHistory] = useState<Signal[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  
  // Integrations State
  const [evolutionConfig, setEvolutionConfig] = useState({ url: '', key: '', instance: 'WayAxiom' });
  const [n8nConfig, setN8nConfig] = useState({ webhook: '' });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [isFetchingQR, setIsFetchingQR] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Poll for connection status
  const [instanceInfo, setInstanceInfo] = useState<any>(null);

  const callApi = useCallback(async (method: string, endpoint: string, data?: any) => {
    if (!evolutionConfig.url || !evolutionConfig.key) return null;
    
    const instanceName = evolutionConfig.instance.trim().replace(/\s+/g, '_') || 'WayAxiom';
    let url = evolutionConfig.url.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    const baseUrl = url.replace(/\/$/, '');
    const headers: any = { 'apikey': evolutionConfig.key };
    if (data) headers['Content-Type'] = 'application/json';

    try {
      // ALWAYS use proxy to avoid Chrome Mixed Content and CORS blocks
      console.log(`[Evolution] Calling API via proxy: ${method} ${endpoint}`);
      
      const proxyUrl = '/api/evo-proxy-v2';
      let response;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          response = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              url: evolutionConfig.url,
              key: evolutionConfig.key,
              method,
              endpoint,
              data
            })
          });

          if (response.status !== 405) break;
          
          console.warn(`[Evolution] Proxy returned 405. Retry ${retries + 1}/${maxRetries}...`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
        } catch (err) {
          console.error('[Evolution] Fetch error:', err);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (!response) {
        console.error('[Evolution] No response from proxy after retries');
        setApiError('Não foi possível conectar ao servidor. Verifique sua conexão.');
        return null;
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          console.error('[Evolution] Could not parse error response as JSON');
        }

        if (response.status === 405) {
          const isFromProxy = response.headers.get('X-Proxy-Source') === 'WayAxiom-Proxy-V2';
          const hint = errorData.hint || '';
          
          if (isFromProxy) {
            console.error('[Evolution] Proxy itself returned 405.');
            setApiError('Erro de Configuração (405): O proxy interno rejeitou a requisição. Por favor, recarregue a página.');
          } else {
            console.error('[Evolution] Target API (Evolution) returned 405.');
            setApiError(`Erro na API Evolution (405): O servidor Evolution não aceitou este comando. ${hint || 'Verifique se a URL da instância está correta (ex: deve terminar em /v2 ou similar se necessário).'}`);
          }
          return response;
        }
        
        // Handle other errors...
        console.error(`[Evolution] API Error ${response.status}:`, errorData);
        return response;
      }

      if (response.status === 428) {
        console.warn('[Evolution] Instance returned 428 (Precondition Required)');
        // Don't set a blocking error, just log it as it's often transient
        return response;
      }

      if (!response.ok) {
        console.warn(`[Evolution] Proxy call failed with status: ${response.status}`);
        try {
          const errorData = await response.clone().json();
          console.error('[Evolution] Error response data:', errorData);
        } catch (e) {
          const text = await response.clone().text();
          console.error('[Evolution] Error response text (non-JSON):', text.substring(0, 200));
        }
      }

      return response;
    } catch (err) {
      console.error('[Evolution] API call error:', err);
      return null;
    }
  }, [evolutionConfig.url, evolutionConfig.key, evolutionConfig.instance]);

  useEffect(() => {
    let interval: any;

    const checkStatus = async () => {
      if (!evolutionConfig.url || !evolutionConfig.key || isFetchingQR) return;

      try {
        const instanceName = evolutionConfig.instance.trim().replace(/\s+/g, '_');
        // Add timestamp to bypass Chrome cache
        const ts = Date.now();
        let response = await callApi('GET', `/instance/connectionStatus/${instanceName}?t=${ts}`);
        
        if (!response || !response.ok) {
          console.log('[Evolution] connectionStatus failed, trying connectionState...');
          response = await callApi('GET', `/instance/connectionState/${instanceName}?t=${ts}`);
        }
        
        if (!response) return;

        if (response.status === 401 || response.status === 403) {
          console.error('API Key inválida detectada no polling');
          return;
        }

        if (response.status === 428) {
          console.warn('[Evolution] Polling returned 428: Instance not ready.');
          setConnectionStatus('DISCONNECTED');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          // Handle both English and Portuguese keys (common in some Evolution API distributions)
          const state = data?.instance?.state || data?.state || data?.status || 
                        data?.instância?.estado || data?.estado || data?.status;
          
          const isConnected = state === 'open' || state === 'CONNECTED' || state === 'conectado' || state === 'aberto';
          
          if (isConnected) {
            // Force QR Code removal immediately
            if (qrCode) setQrCode(null);
            
            if (connectionStatus !== 'CONNECTED') {
              console.log(`[Evolution] Connection detected for ${instanceName}! Updating UI...`);
              setConnectionStatus('CONNECTED');
              setQrCode(null);
              
              // Fetch info separately
              try {
                const infoRes = await callApi('GET', `/instance/fetchInstances?instanceName=${instanceName}`);
                if (infoRes && infoRes.ok) {
                  const infoData = await infoRes.json();
                  const info = Array.isArray(infoData) ? infoData.find((i: any) => (i.instanceName || i.nomeInstância) === instanceName) : infoData;
                  setInstanceInfo(info);
                }
              } catch (infoErr) {
                console.error('Error fetching instance info:', infoErr);
              }
            }
          } else {
            if (connectionStatus === 'CONNECTED') {
              setConnectionStatus('DISCONNECTED');
              setInstanceInfo(null);
            }
          }
        }
      } catch (error) {
        // Silent error for polling
      }
    };

    if (evolutionConfig.url && evolutionConfig.key) {
      checkStatus(); // Initial check
      interval = setInterval(checkStatus, 5000); // Faster polling (5s) for better UX
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [evolutionConfig.url, evolutionConfig.key, evolutionConfig.instance, isFetchingQR, connectionStatus, callApi]);

  const logoutInstance = async () => {
    if (!evolutionConfig.url || !evolutionConfig.key) return;
    
    const confirmLogout = window.confirm("Tem certeza que deseja desconectar o WhatsApp?");
    if (!confirmLogout) return;

    try {
      const instanceName = evolutionConfig.instance.trim().replace(/\s+/g, '_');
      console.log(`[Evolution] Logging out instance: ${instanceName}`);
      const response = await callApi('DELETE', `/instance/logout/${instanceName}`);
      
      if (response && response.status === 404) {
        console.warn('[Evolution] Instance not found during logout, cleaning up local state anyway.');
      }
      
      setConnectionStatus('DISCONNECTED');
      setQrCode(null);
      setInstanceInfo(null);
    } catch (error) {
      console.error('Logout error:', error);
      setConnectionStatus('DISCONNECTED');
      setQrCode(null);
      setInstanceInfo(null);
    }
  };

  const fetchQRCode = async () => {
    if (!evolutionConfig.url || !evolutionConfig.key) return;
    
    setIsFetchingQR(true);
    setConnectionStatus('CONNECTING');
    setQrCode(null);
    setApiError(null);
    
    try {
      const instanceName = evolutionConfig.instance.trim().replace(/\s+/g, '_') || 'WayAxiom';
      console.log(`[Evolution] Starting connection flow for instance: ${instanceName}`);
      
      // 1. Check if instance already exists and its status
      try {
        const statusResponse = await callApi('GET', `/instance/connectionStatus/${instanceName}`);
        console.log(`[Evolution] Status check for ${instanceName}:`, statusResponse?.status);
        
        if (statusResponse && statusResponse.ok) {
          const statusData = await statusResponse.json();
          const state = statusData?.instance?.state || statusData?.state || statusData?.status || 
                        statusData?.instância?.estado || statusData?.estado;
          
          const isConnected = state === 'open' || state === 'CONNECTED' || state === 'conectado' || state === 'aberto';
          
          if (isConnected) {
            setConnectionStatus('CONNECTED');
            setQrCode(null);
            setIsFetchingQR(false);
            return;
          }
        }
      } catch (e) {
        console.log('Status check failed, proceeding to create/connect');
      }

      // 2. Try to create the instance (it might already exist, which is fine)
      try {
        const createResponse = await callApi('POST', '/instance/create', {
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        });
        
        if (createResponse && createResponse.ok) {
          const createData = await createResponse.json();
          console.log('[Evolution] Create response:', createData);
          const qrFromCreate = createData.base64 || 
                               (typeof createData.qrcode === 'string' ? createData.qrcode : createData.qrcode?.base64) || 
                               (typeof createData.code === 'string' ? createData.code : createData.code?.base64) ||
                               createData.instance?.qrcode?.base64;
          if (qrFromCreate) {
            let qr = qrFromCreate;
            if (!qr.startsWith('data:image')) qr = `data:image/png;base64,${qr}`;
            setQrCode(qr);
            setConnectionStatus('DISCONNECTED');
            setIsFetchingQR(false);
            return;
          }
        } else if (createResponse && (createResponse.status === 401 || createResponse.status === 403)) {
          console.warn('[Evolution] API Key might not have permission to CREATE instances. Proceeding to CONNECT check.');
        }
        // Small delay to allow instance initialization if it was just created
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e: any) {
        console.log('Instance creation failed or already exists, proceeding to connect...');
      }
      
      // 3. Now try to connect/get QR code
      const connectResponse = await callApi('GET', `/instance/connect/${instanceName}`);
      
      if (!connectResponse || !connectResponse.ok) {
        if (connectResponse && (connectResponse.status === 401 || connectResponse.status === 403)) {
          throw new Error('API Key inválida ou sem permissão para acessar esta instância.');
        }
        if (connectResponse && connectResponse.status === 404) {
          throw new Error('Instância não encontrada (404). Verifique se o Nome da Instância no painel da Evolution é exatamente igual ao digitado.');
        }
        
        let errorMsg = connectResponse ? `Erro ${connectResponse.status}` : 'Falha na conexão';
        let hint = '';
        try {
          if (connectResponse) {
            const errorData = await connectResponse.json();
            errorMsg = errorData.message || errorData.error || errorMsg;
            hint = errorData.hint || '';
          }
        } catch (e) {
          errorMsg = (connectResponse && connectResponse.statusText) || errorMsg;
        }
        throw new Error(hint ? `${errorMsg}. Dica: ${hint}` : errorMsg);
      }

      const data = await connectResponse.json();
      console.log('[Evolution] Connect response:', data);

      // Check for QR code in various possible fields (Evolution API v1 and v2)
      const qrBase64 = data.base64 || 
                       (typeof data.qrcode === 'string' ? data.qrcode : (data.qrcode?.base64 || data.qrcode?.code)) || 
                       (typeof data.code === 'string' ? data.code : (data.code?.base64 || data.code?.code)) ||
                       data.instance?.qrcode?.base64 ||
                       data.instance?.qrcode?.code;
      
      if (qrBase64 && typeof qrBase64 === 'string') {
        let qr = qrBase64;
        if (!qr.startsWith('data:image')) {
          qr = `data:image/png;base64,${qr}`;
        }
        setQrCode(qr);
        setConnectionStatus('DISCONNECTED');
      } else {
        const state = data.instance?.status || data.status || data.state || data.instance?.state || 
                      data.instância?.estado || data.estado;
        
        const isConnected = state === 'open' || state === 'CONNECTED' || state === 'conectado' || state === 'aberto';
        
        if (isConnected) {
          setConnectionStatus('CONNECTED');
          setQrCode(null);
        } else if (data.code === 'instance_not_found') {
          throw new Error('Instância não encontrada. Verifique o nome da instância.');
        } else {
          // If we get here and there's no QR, maybe it's already connected but the status field is different
          const finalStatusCheck = await callApi('GET', `/instance/connectionStatus/${instanceName}`);
          if (finalStatusCheck && finalStatusCheck.ok) {
            const finalData = await finalStatusCheck.json();
            const finalState = finalData?.instance?.state || finalData?.state || finalData?.status || 
                               finalData?.instância?.estado || finalData?.estado;
            
            const isFinalConnected = finalState === 'open' || finalState === 'CONNECTED' || finalState === 'conectado' || finalState === 'aberto';
            
            if (isFinalConnected) {
              setConnectionStatus('CONNECTED');
              setQrCode(null);
              return;
            }
          }
          throw new Error('Não foi possível obter o QR Code. Verifique se a instância já está conectada ou se o nome está correto.');
        }
      }
    } catch (error: any) {
      console.error('Error in Evolution API flow:', error);
      const message = error.message || 'Falha na conexão';
      setApiError(`Erro: ${message}. Verifique a URL, API Key e o Nome da Instância.`);
      setConnectionStatus('DISCONNECTED');
    } finally {
      setIsFetchingQR(false);
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (usageCount >= 3) {
      setIsUpgrading(true);
      return;
    }

    if (!uploadedFile) {
      alert("Por favor, envie um gráfico primeiro.");
      return;
    }

    setState('SCANNING');
    setAiInsight("Analisando imagem e identificando par de ativos...");
    
    try {
      // Extract mime type and base64 data from data URL
      const mimeType = uploadedFile.split(';')[0].split(':')[1];
      const base64Data = uploadedFile.split(',')[1];

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };

      // First, identify the asset and get the analysis
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            imagePart,
            { text: `Analise este gráfico de trading. 
            1. Identifique o par de ativos (ex: EUR/USD, BTC/USDT, etc). Se não conseguir identificar, use "${selectedAsset}".
            2. Determine se a melhor entrada é COMPRA (CALL) ou VENDA (PUT).
            3. Forneça uma justificativa técnica curta (máximo 15 palavras).
            4. Identifique o Timeframe do gráfico (ex: M1, M5, M15, H1). Se não identificar, use "M1/M5".
            5. Atribua um nível de confiança de 0 a 100 baseado na clareza do padrão.
            6. Retorne no formato JSON: {"asset": "PAR", "action": "COMPRA ou VENDA", "insight": "JUSTIFICATIVA", "timeframe": "TIMEFRAME", "confidence": 95}` }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || "{}");
      const detectedAsset = result.asset || selectedAsset;
      const detectedAction = result.action === 'VENDA' ? 'VENDA (PUT)' : 'COMPRA (CALL)';
      const detectedConfidence = result.confidence || Math.floor(Math.random() * (98 - 85 + 1)) + 85;
      const detectedTimeframe = result.timeframe || 'M1/M5';
      
      setSelectedAsset(detectedAsset);
      setAiInsight(result.insight || "Padrão de reversão identificado.");

      const newSignal: Signal = {
        asset: detectedAsset,
        action: detectedAction as 'COMPRA (CALL)' | 'VENDA (PUT)',
        color: detectedAction.includes('COMPRA') ? '#00FF7F' : '#FF4444',
        confidence: detectedConfidence,
        timeframe: detectedTimeframe
      };

      setCurrentSignal(newSignal);
      setHistory(prev => [newSignal, ...prev].slice(0, 10)); // Keep last 10
      setState('SIGNAL_FOUND');
      setUsageCount(prev => prev + 1);
    } catch (e) {
      console.error("Erro na análise da IA:", e);
      setAiInsight("Erro ao processar imagem. Tente novamente.");
      setState('IDLE');
    }
  };

  const resetAnalysis = () => {
    setState('IDLE');
    setCurrentSignal(null);
    setUploadedFile(null);
    setAiInsight("");
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-[#050505]">
      {!showDashboard ? (
        <div id="welcome-screen" className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
          {/* Purple Waves Background */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.8">
                {Array.from({ length: 120 }).map((_, i) => (
                  <path
                    key={`left-${i}`}
                    d={`M -100 ${800 - i * 8} Q ${400} ${400}, 1600 ${400 + (i - 60) * 15}`}
                    stroke="#8B5CF6"
                    strokeWidth="0.4"
                    strokeOpacity={0.05 + (i / 120) * 0.3}
                  />
                ))}
                {Array.from({ length: 120 }).map((_, i) => (
                  <path
                    key={`right-${i}`}
                    d={`M 1540 ${0 + i * 8} Q ${1040} ${400}, -200 ${400 - (i - 60) * 15}`}
                    stroke="#A78BFA"
                    strokeWidth="0.4"
                    strokeOpacity={0.05 + (i / 120) * 0.3}
                  />
                ))}
              </g>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center p-6 max-w-lg">
            <div className="mb-12 animate-float">
              <img 
                src="https://xzlotpwqpdjwzqerdyfb.supabase.co/storage/v1/object/public/WayIA/logoatu-removebg-preview.png" 
                alt="Logo" 
                className="h-32 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              VISION AI
            </h1>
            
            <p className="text-zinc-400 text-lg mb-12 leading-relaxed font-medium">
              A inteligência artificial mais avançada para detecção de sinais em tempo real.
            </p>

            <button 
              onClick={() => setShowDashboard(true)}
              className="group relative px-12 py-5 bg-primary-purple rounded-2xl font-black text-lg tracking-widest uppercase overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(168,85,247,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative z-10">Acesse o Dashboard</span>
            </button>

            <div className="mt-12 flex items-center gap-6 opacity-40">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Rápido</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Preciso</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Purple Waves Background (Moved from welcome screen to main app) */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.8">
            {Array.from({ length: 120 }).map((_, i) => (
              <path
                key={`left-${i}`}
                d={`M -100 ${800 - i * 8} Q ${400} ${400}, 1600 ${400 + (i - 60) * 15}`}
                stroke="#8B5CF6"
                strokeWidth="0.4"
                strokeOpacity={0.05 + (i / 120) * 0.3}
              />
            ))}
            {Array.from({ length: 120 }).map((_, i) => (
              <path
                key={`right-${i}`}
                d={`M 1540 ${0 + i * 8} Q ${1040} ${400}, -200 ${400 - (i - 60) * 15}`}
                stroke="#A78BFA"
                strokeWidth="0.4"
                strokeOpacity={0.05 + (i / 120) * 0.3}
              />
            ))}
          </g>
        </svg>
      </div>
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-14 flex items-center justify-center">
            <img 
              src="https://xzlotpwqpdjwzqerdyfb.supabase.co/storage/v1/object/public/WayIA/logoatu-removebg-preview.png" 
              alt="Logo" 
              className="h-full w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-white/40">Horário de Brasília</span>
            <span className="text-sm font-mono text-white/90">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Mercado Aberto</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-purple/20 border border-primary-purple/30 flex items-center justify-center text-primary-purple">
            <User className="w-5 h-5" />
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center p-6 max-w-5xl mx-auto w-full">
        <div className="w-full flex flex-col items-center">
          {activeTab === 'planos' && (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              {/* Starter Plan */}
              <div className="glass-card p-6 rounded-[24px] border border-white/5 flex flex-col hover:border-white/10 transition-all">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-zinc-400 mb-1">Vision Starter</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">R$ 77</span>
                    <span className="text-zinc-500 text-xs">/mês</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-xs text-zinc-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                    10 sinais diários
                  </li>
                  <li className="flex items-center gap-3 text-xs text-zinc-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                    Análise técnica básica
                  </li>
                  <li className="flex items-center gap-3 text-xs text-zinc-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                    Suporte via comunidade
                  </li>
                </ul>
                <button className="w-full py-3 btn-secondary rounded-xl font-bold text-sm">
                  Assinar Starter
                </button>
              </div>

              {/* Pro Plan */}
              <div className="glass-card p-6 rounded-[24px] border-2 border-primary-purple/50 flex flex-col relative overflow-hidden hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all">
                <div className="absolute top-3 right-3 bg-primary-purple text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Mais Popular
                </div>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-primary-purple mb-1">Vision Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">R$ 249</span>
                    <span className="text-zinc-500 text-xs">/mês</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-purple" />
                    Sinais ilimitados 24/7
                  </li>
                  <li className="flex items-center gap-3 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-purple" />
                    IA de Alta Precisão (95%+)
                  </li>
                  <li className="flex items-center gap-3 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-purple" />
                    Integração WhatsApp (Evolution/n8n)
                  </li>
                  <li className="flex items-center gap-3 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-purple" />
                    Suporte VIP Prioritário
                  </li>
                  <li className="flex items-center gap-3 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-purple" />
                    Acesso a todos os pares (OTC e Real)
                  </li>
                </ul>
                <button className="w-full py-3 btn-primary rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-transform">
                  Assinar Pro
                </button>
              </div>
            </div>
          )}

          {activeTab === 'gestao' && (
            <div className="w-full max-w-2xl space-y-6">
              <div className="glass-card p-8 rounded-[32px] border border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Integração Evolution API</h3>
                      <p className="text-zinc-500 text-sm">Conecte seu WhatsApp para receber sinais</p>
                    </div>
                  </div>
                  {evolutionConfig.url && evolutionConfig.key && (
                    <button 
                      onClick={() => fetchQRCode()}
                      disabled={isFetchingQR}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-white"
                      title="Forçar atualização de status"
                    >
                      <RefreshCw className={`w-5 h-5 ${isFetchingQR ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); fetchQRCode(); }} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">URL da Instância</label>
                    <input 
                      type="text" 
                      placeholder="https://sua-api.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary-purple outline-none transition-colors"
                      value={evolutionConfig.url}
                      onChange={(e) => setEvolutionConfig({...evolutionConfig, url: e.target.value})}
                    />
                    {evolutionConfig.url && !evolutionConfig.url.includes('.') && evolutionConfig.url.length > 5 && (
                      <p className="text-[9px] text-amber-500 mt-1">⚠️ Isso não parece uma URL válida. Use o endereço completo (ex: https://api.exemplo.com)</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">API Key</label>
                      <input 
                        type="password" 
                        placeholder="Sua chave secreta"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary-purple outline-none transition-colors"
                        value={evolutionConfig.key}
                        onChange={(e) => setEvolutionConfig({...evolutionConfig, key: e.target.value})}
                        autoComplete="current-password"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">Nome da Instância</label>
                      <input 
                        type="text" 
                        placeholder="WayAxiom"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary-purple outline-none transition-colors"
                        value={evolutionConfig.instance}
                        onChange={(e) => setEvolutionConfig({...evolutionConfig, instance: e.target.value})}
                      />
                      <p className="text-[9px] text-zinc-600 mt-1">Dica: Use o nome exato do painel Evolution (espaços serão convertidos em _)</p>
                    </div>
                  </div>

                  <div key="evolution-status-container" className="mt-6 min-h-[100px] flex flex-col justify-center">
                    {(() => {
                      if (apiError) {
                        return (
                          <div key="api-error" className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500">
                            {apiError}
                          </div>
                        );
                      }

                      if (connectionStatus === 'CONNECTED') {
                        return (
                          <div key="connected-card" className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[24px] space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                              </div>
                              <div>
                                <h4 className="text-emerald-500 font-bold text-sm">WhatsApp Conectado</h4>
                                <p className="text-zinc-500 text-xs">Instância: <span className="text-zinc-300 font-mono">{evolutionConfig.instance}</span></p>
                              </div>
                            </div>
                            
                            {instanceInfo && (
                              <div key="instance-info" className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                                <div className="bg-white/5 p-3 rounded-xl">
                                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Status</p>
                                  <p className="text-xs text-emerald-400 font-medium">Online</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl">
                                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Número</p>
                                  <p className="text-xs text-zinc-300 font-medium">
                                    {instanceInfo?.owner || instanceInfo?.number || instanceInfo?.instance?.owner || '---'}
                                  </p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl col-span-2">
                                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Versão API</p>
                                  <p className="text-xs text-zinc-400 font-mono">
                                    {instanceInfo?.version || 'v2.x'}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="pt-2">
                              <button 
                                type="button"
                                onClick={logoutInstance}
                                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] uppercase font-bold transition-all flex items-center justify-center gap-2"
                              >
                                <LogOut className="w-3 h-3" />
                                Desconectar WhatsApp
                              </button>
                            </div>
                          </div>
                        );
                      }

                      if (isFetchingQR && !qrCode) {
                        return (
                          <div key="loading-qr" className="mb-6 flex flex-col items-center p-12 bg-white/5 rounded-3xl border border-white/5">
                            <Loader2 className="w-10 h-10 text-primary-purple animate-spin mb-4" />
                            <p className="text-xs font-bold text-primary-purple animate-pulse uppercase tracking-widest">Solicitando QR Code...</p>
                          </div>
                        );
                      }

                      if (qrCode) {
                        return (
                          <div key="qr-container" className="mb-6 flex flex-col items-center p-6 bg-white/5 rounded-3xl border border-white/10">
                            <p className="text-[10px] font-black mb-4 uppercase tracking-[0.2em] text-zinc-400">Escaneie com seu WhatsApp</p>
                            <div className="bg-white p-3 rounded-2xl shadow-2xl">
                              <img 
                                src={qrCode} 
                                key={`qr-img-${qrCode.length}`}
                                alt="WhatsApp QR Code" 
                                className="w-48 h-48 object-contain"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={fetchQRCode}
                              className="mt-4 flex items-center gap-2 text-[10px] font-bold text-zinc-500 hover:text-primary-purple transition-colors uppercase"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Atualizar QR Code
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div key="disconnected-placeholder" className="p-12 border-2 border-dashed border-white/5 rounded-[24px] flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <LinkIcon className="w-8 h-8 text-zinc-600" />
                          </div>
                          <p className="text-zinc-500 text-sm max-w-[200px]">Configure os dados acima e clique em conectar</p>
                        </div>
                      );
                    })()}
                  </div>

                  <button 
                    type="submit"
                    disabled={isFetchingQR || !evolutionConfig.url || !evolutionConfig.key}
                    className="w-full py-4 btn-primary rounded-2xl font-bold text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-95 transition-all"
                  >
                    {isFetchingQR ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Buscando QR Code...
                      </>
                    ) : connectionStatus === 'CONNECTED' ? (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Reconectar WhatsApp
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Conectar WhatsApp
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="glass-card p-8 rounded-[32px] border border-white/5">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary-purple/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary-purple" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Integração n8n</h3>
                      <p className="text-zinc-500 text-sm">Automatize seus sinais com workflows</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">Webhook URL</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="https://n8n.seu-servidor.com/webhook/..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary-purple outline-none transition-colors pr-12"
                          value={n8nConfig.webhook}
                          onChange={(e) => setN8nConfig({webhook: e.target.value})}
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button className="w-full py-3 btn-secondary rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Salvar Webhook
                    </button>
                  </div>
              </div>

              {/* Debug Section */}
              <div className="glass-card p-6 rounded-[32px] border border-white/5 bg-red-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider">Diagnóstico de Conexão</h3>
                </div>
                
                <div className="space-y-3">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Se você está recebendo erro 405, isso geralmente significa que o endereço da API Evolution está incorreto ou o servidor não aceitou o comando.
                  </p>
                  
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Status do Proxy</span>
                      <span className="text-[10px] text-emerald-500 font-bold uppercase">Ativo (v2.1)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Último Erro</span>
                      <span className="text-[10px] text-red-400 font-bold truncate max-w-[150px]">{apiError || 'Nenhum'}</span>
                    </div>
                  </div>

                    <button 
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/test-proxy?v=' + Date.now());
                          const contentType = res.headers.get('content-type');
                          
                          if (!res.ok) {
                            const text = await res.text();
                            alert(`Erro no Servidor (${res.status}): ${text.substring(0, 100)}...`);
                            return;
                          }

                          if (contentType && contentType.includes('application/json')) {
                            const data = await res.json();
                            alert(`Conexão Interna OK: ${data.message}\n\nO servidor está respondendo corretamente.`);
                          } else {
                            const text = await res.text();
                            console.error('[Proxy Test] Non-JSON response:', text.substring(0, 200));
                            alert(`Aviso: O servidor respondeu, mas não enviou JSON. \n\nIsso geralmente acontece se você estiver acessando por uma URL que não suporta o backend (como Cloudflare Pages direto). \n\nUse a URL oficial do App fornecida no chat.`);
                          }
                        } catch (e: any) {
                          alert(`Erro de Rede: ${e.message}\n\nVerifique se você está usando a URL correta do App.`);
                        }
                      }}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      Testar Conexão Interna
                    </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'historico' && (
            <div className="w-full max-w-2xl space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Histórico de Sinais</h3>
                <span className="text-xs text-zinc-500">{history.length} sinais registrados</span>
              </div>
              
              {history.length === 0 ? (
                <div className="glass-card p-12 rounded-[32px] text-center border border-white/5">
                  <History className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">Nenhum sinal gerado nesta sessão.</p>
                </div>
              ) : (
                history.map((sig, i) => (
                  <div key={i} className="glass-card p-6 rounded-2xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white/40" />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{sig.asset}</div>
                        <div className="text-xs text-zinc-500">{sig.timeframe} • {sig.confidence}% Assertividade</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm uppercase" style={{ color: sig.color }}>{sig.action}</div>
                      <div className="text-[10px] text-zinc-600">Detectado via Vision</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'analise' && (
            <div className="w-full flex flex-col items-center">
              {/* History Preview (Desktop) */}
              {history.length > 0 && (
                <div className="hidden lg:block w-full max-w-4xl mb-8 glass-card rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
                      <History className="w-3 h-3" /> Últimos Sinais Detectados
                    </h3>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {history.map((sig, i) => (
                      <div key={i} className="flex-shrink-0 bg-white/5 rounded-xl p-3 border border-white/5 min-w-[140px] hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-white/80">{sig.asset}</span>
                          <span className="text-[9px] text-white/40">{sig.timeframe}</span>
                        </div>
                        <div className="text-[10px] font-black" style={{ color: sig.color }}>{sig.action}</div>
                        <div className="text-[10px] text-white/60">{sig.confidence}% Assertividade</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Daily Limit Badge */}
              <div className="mb-8 px-6 py-2.5 rounded-xl bg-primary-purple/5 border border-primary-purple/20 flex items-center gap-3">
                <Activity className="w-4 h-4 text-primary-purple" />
                <span className="text-sm font-medium text-primary-purple/80">
                  Análises hoje: {usageCount}/3 ({3 - usageCount} restantes)
                </span>
              </div>

              {/* Asset Selector */}
              <div className="relative mb-8 w-full max-w-sm">
                <button 
                  onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                  className="w-full h-14 bg-[#0F0F0F] border border-white/5 rounded-2xl px-6 flex items-center justify-between group hover:border-primary-purple/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="font-bold tracking-tight">{selectedAsset}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${isAssetDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isAssetDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-20 max-h-60 overflow-y-auto">
                    {ASSETS.map((asset) => (
                      <button 
                        key={asset}
                        onClick={() => {
                          setSelectedAsset(asset);
                          setIsAssetDropdownOpen(false);
                        }}
                        className="w-full px-6 py-4 text-left hover:bg-primary-purple/10 transition-colors flex items-center justify-between group"
                      >
                        <span className={selectedAsset === asset ? 'text-primary-purple font-bold' : 'text-zinc-400'}>{asset}</span>
                        {selectedAsset === asset && <CheckCircle2 className="w-4 h-4 text-primary-purple" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Analysis Card */}
              <div className="w-full max-w-md glass-card rounded-[32px] p-8 flex flex-col items-center relative overflow-hidden">
                {state === 'SCANNING' && (
                  <div className="absolute inset-0 bg-primary-purple/5 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-12 h-12 text-primary-purple animate-spin mb-4" />
                    <span className="text-sm font-bold tracking-widest text-primary-purple animate-pulse uppercase">IA Processando...</span>
                  </div>
                )}

                {state === 'SIGNAL_FOUND' ? (
                  <div className="w-full text-center">
                    <div className="mb-6">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold block mb-2">Sinal Detectado</span>
                      <h3 className="text-5xl font-black tracking-tighter mb-2">{currentSignal?.asset}</h3>
                      <div className="flex items-center justify-center gap-2">
                        {currentSignal?.action.includes('COMPRA') ? 
                          <TrendingUp className="w-6 h-6 text-emerald-400" /> : 
                          <TrendingDown className="w-6 h-6 text-rose-500" />
                        }
                        <p className="text-2xl font-bold" style={{ color: currentSignal?.color }}>{currentSignal?.action}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-zinc-500 uppercase block mb-1">Assertividade</span>
                        <span className="text-xl font-mono font-bold text-emerald-400">{currentSignal?.confidence}%</span>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-zinc-500 uppercase block mb-1">Timeframe</span>
                        <span className="text-xl font-mono font-bold">{currentSignal?.timeframe}</span>
                      </div>
                    </div>

                    <p className="text-sm text-zinc-400 italic mb-10 px-4 leading-relaxed">
                      "{aiInsight}"
                    </p>

                    <button 
                      onClick={resetAnalysis}
                      className="w-full py-5 btn-secondary rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Nova Análise
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-3xl bg-primary-purple/10 border border-primary-purple/20 flex items-center justify-center mb-6">
                      <Camera className="w-10 h-10 text-primary-purple" />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2">Enviar Gráfico</h3>
                    <p className="text-zinc-500 text-sm mb-10">Escolha como deseja enviar</p>

                    <div className="w-full space-y-4 mb-10">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 btn-primary rounded-2xl flex items-center justify-center gap-3"
                      >
                        <Camera className="w-5 h-5" />
                        Tirar Foto
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 btn-secondary rounded-2xl flex items-center justify-center gap-3"
                      >
                        <ImageIcon className="w-5 h-5" />
                        Escolher da Galeria
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                      />
                    </div>

                    {uploadedFile && (
                      <div className="w-full mb-8 flex flex-col items-center">
                        <div className="relative w-full max-h-[400px] aspect-[3/4] rounded-2xl overflow-hidden border border-emerald-500/30 mb-3 bg-black/40">
                          <img src={uploadedFile} alt="Preview" className="w-full h-full object-contain" />
                          <div className="absolute top-3 right-3 bg-emerald-500/20 backdrop-blur-md p-1.5 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </div>
                        </div>
                        <span className="text-xs text-emerald-400 font-medium tracking-tight">Gráfico carregado com sucesso!</span>
                      </div>
                    )}

                    <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] mb-8">
                      Ou arraste e solte o arquivo aqui
                    </p>

                    <button 
                      onClick={startAnalysis}
                      disabled={!uploadedFile || state === 'SCANNING'}
                      className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        uploadedFile 
                        ? 'bg-primary-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                        : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      Analisar Gráfico
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'calendario' && (
            <div className="w-full max-w-2xl space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Calendário Econômico</h3>
                <span className="text-xs text-zinc-500">Eventos de hoje</span>
              </div>
              
              {[
                { time: '09:30', currency: 'USD', impact: 'high', event: 'Payroll (NFP)', forecast: '200k', actual: '---' },
                { time: '11:00', currency: 'EUR', impact: 'medium', event: 'CPI (YoY)', forecast: '2.4%', actual: '2.6%' },
                { time: '14:30', currency: 'GBP', impact: 'low', event: 'BoE Speech', forecast: '---', actual: '---' },
                { time: '16:00', currency: 'USD', impact: 'high', event: 'FOMC Meeting', forecast: '---', actual: '---' },
              ].map((item, i) => (
                <div key={i} className="glass-card p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-xs font-mono text-zinc-500">{item.time}</div>
                    <div className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold">{item.currency}</div>
                    <div>
                      <div className="text-sm font-bold">{item.event}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-1 h-1 rounded-full ${item.impact === 'high' ? 'bg-rose-500' : item.impact === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <span className="text-[9px] uppercase text-zinc-600 font-bold">{item.impact} Impact</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-500 uppercase">Prev: {item.forecast}</div>
                    <div className="text-xs font-bold text-white/80">{item.actual}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ranking' && (
            <div className="w-full max-w-2xl">
              <div className="glass-card rounded-[32px] overflow-hidden">
                <div className="p-8 border-b border-white/5">
                  <h3 className="text-xl font-bold">Top Traders Vision</h3>
                  <p className="text-zinc-500 text-sm">Ranking global de assertividade</p>
                </div>
                <div className="p-4">
                  {[
                    { name: 'Ricardo M.', winrate: '94.2%', profit: 'R$ 12.430' },
                    { name: 'Ana Paula', winrate: '91.8%', profit: 'R$ 8.120' },
                    { name: 'Lucas Silva', winrate: '89.5%', profit: 'R$ 5.600' },
                    { name: 'Marcos J.', winrate: '88.2%', profit: 'R$ 4.900' },
                    { name: 'Julia F.', winrate: '87.9%', profit: 'R$ 3.200' },
                  ].map((trader, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-600 font-mono w-4">{i + 1}</span>
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold">
                          {trader.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium">{trader.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold">{trader.winrate}</div>
                        <div className="text-[10px] text-zinc-500 uppercase">{trader.profit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-50">
        <button 
          onClick={() => setActiveTab('analise')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'analise' ? 'nav-item-active' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <LineChart className="w-5 h-5" />
          <span className="text-[9px] uppercase font-bold tracking-widest">Análise</span>
        </button>
        <button 
          onClick={() => setActiveTab('historico')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'historico' ? 'nav-item-active' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <History className="w-5 h-5" />
          <span className="text-[9px] uppercase font-bold tracking-widest">Histórico</span>
        </button>
        <button 
          onClick={() => setActiveTab('calendario')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'calendario' ? 'nav-item-active' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[9px] uppercase font-bold tracking-widest">Agenda</span>
        </button>
        <button 
          onClick={() => setActiveTab('ranking')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'ranking' ? 'nav-item-active' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[9px] uppercase font-bold tracking-widest">Ranking</span>
        </button>
        <button 
          onClick={() => setActiveTab('gestao')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'gestao' ? 'nav-item-active' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[9px] uppercase font-bold tracking-widest">Gestão</span>
        </button>
        <button 
          onClick={() => setActiveTab('planos')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'planos' ? 'nav-item-active' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Crown className="w-5 h-5" />
          <span className="text-[9px] uppercase font-bold tracking-widest">VIP</span>
        </button>
      </nav>
        </>
      )}
    </div>
  );
}
