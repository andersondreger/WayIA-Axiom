/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Shield, Zap, TrendingUp, TrendingDown, RefreshCw, 
  Crown, Trophy, LineChart, Wallet, History, ChevronDown, 
  CheckCircle2, Loader2, Camera, Image as ImageIcon, Eye, User, LogOut, LayoutGrid,
  MessageSquare, Settings, Link as LinkIcon, Calendar, Target
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini with environment variable support for multiple platforms
const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

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
  const [showDashboard, setShowDashboard] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('analise');
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  
  // Dashboard States
  const [state, setState] = useState<SignalState>('IDLE');
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null);
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

  // Poll for connection status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      if (!evolutionConfig.url || !evolutionConfig.key || connectionStatus === 'CONNECTED') return;

      try {
        const response = await fetch(`${evolutionConfig.url}/instance/connectionStatus/${evolutionConfig.instance}`, {
          method: 'GET',
          headers: {
            'apikey': evolutionConfig.key
          }
        });
        const data = await response.json();
        
        if (data.instance?.state === 'open' || data.state === 'open') {
          setConnectionStatus('CONNECTED');
          setQrCode(null);
        }
      } catch (error) {
        // Silent error for polling
      }
    };

    if (evolutionConfig.url && evolutionConfig.key && connectionStatus !== 'CONNECTED') {
      interval = setInterval(checkStatus, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [evolutionConfig.url, evolutionConfig.key, evolutionConfig.instance, connectionStatus]);

  const fetchQRCode = async () => {
    if (!evolutionConfig.url || !evolutionConfig.key) return;
    
    setIsFetchingQR(true);
    setConnectionStatus('CONNECTING');
    setQrCode(null);
    
    try {
      // 1. Check if instance already exists and its status
      const statusResponse = await fetch(`${evolutionConfig.url}/instance/connectionStatus/${evolutionConfig.instance}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionConfig.key
        }
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.instance?.state === 'open' || statusData.state === 'open') {
          setConnectionStatus('CONNECTED');
          setQrCode(null);
          setIsFetchingQR(false);
          return;
        }
      }

      // 2. Try to create the instance (it might already exist, which is fine)
      await fetch(`${evolutionConfig.url}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.key
        },
        body: JSON.stringify({
          instanceName: evolutionConfig.instance,
          qrcode: true
        })
      });
      
      // 3. Now try to connect/get QR code
      const connectResponse = await fetch(`${evolutionConfig.url}/instance/connect/${evolutionConfig.instance}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionConfig.key
        }
      });
      
      const data = await connectResponse.json();
      
      if (data.base64) {
        setQrCode(data.base64);
        setConnectionStatus('DISCONNECTED');
      } else if (data.instance?.status === 'open' || data.status === 'open' || data.state === 'open') {
        setConnectionStatus('CONNECTED');
        setQrCode(null);
      }
    } catch (error) {
      console.error('Error in Evolution API flow:', error);
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

  if (!showDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-8 relative overflow-hidden bg-black">
        {/* Purple Waves Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.8">
              {/* Left Fan - Dense radiating lines */}
              {Array.from({ length: 120 }).map((_, i) => (
                <path
                  key={`left-${i}`}
                  d={`M -100 ${800 - i * 8} Q ${400} ${400}, 1600 ${400 + (i - 60) * 15}`}
                  stroke="#8B5CF6"
                  strokeWidth="0.4"
                  strokeOpacity={0.05 + (i / 120) * 0.3}
                />
              ))}
              {/* Right Fan - Dense radiating lines */}
              {Array.from({ length: 120 }).map((_, i) => (
                <path
                  key={`right-${i}`}
                  d={`M 1540 ${0 + i * 8} Q ${1040} ${400}, -200 ${400 - (i - 60) * 15}`}
                  stroke="#A78BFA"
                  strokeWidth="0.4"
                  strokeOpacity={0.05 + (i / 120) * 0.3}
                />
              ))}
              
              {/* Central Glow/Flow lines */}
              {Array.from({ length: 20 }).map((_, i) => (
                <path
                  key={`center-${i}`}
                  d={`M -100 ${400} Q 720 ${350 + i * 5}, 1540 ${400}`}
                  stroke="#C084FC"
                  strokeWidth="1"
                  strokeOpacity="0.1"
                />
              ))}
            </g>
          </svg>
        </div>

        {/* Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-purple/5 rounded-full blur-[120px]" />
        
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary-purple/20 blur-3xl rounded-full" />
              <div className="w-[500px] h-[250px] flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-primary-purple/10 rounded-full blur-2xl group-hover:bg-primary-purple/20 transition-all" />
                <img 
                  src="https://xzlotpwqpdjwzqerdyfb.supabase.co/storage/v1/object/public/WayIA/logoatu-removebg-preview.png" 
                  alt="WAY AXIOM Logo" 
                  className="w-full h-full object-contain relative z-10"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="glass-card w-full max-w-md p-10 rounded-3xl text-center">
              <h3 className="text-3xl font-bold mb-6 text-white">Bem-vindo</h3>
              <p className="text-zinc-400 mb-10 leading-relaxed">
                Acesse agora a tecnologia mais avançada de análise de mercado com inteligência artificial.
              </p>
              <button 
                onClick={() => setShowDashboard(true)}
                className="w-full py-5 btn-primary rounded-2xl text-lg hover:scale-[1.02] active:scale-95"
              >
                Acessar Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24">
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
            onClick={() => setShowDashboard(false)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center p-6 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'planos' && (
            <motion.div 
              key="planos"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl"
            >
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
            </motion.div>
          )}

          {activeTab === 'gestao' && (
            <motion.div 
              key="gestao"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl space-y-6"
            >
              <div className="glass-card p-8 rounded-[32px] border border-white/5">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Integração Evolution API</h3>
                    <p className="text-zinc-500 text-sm">Conecte seu WhatsApp para receber sinais</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">URL da Instância</label>
                    <input 
                      type="text" 
                      placeholder="https://sua-api.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary-purple outline-none transition-colors"
                      value={evolutionConfig.url}
                      onChange={(e) => setEvolutionConfig({...evolutionConfig, url: e.target.value})}
                    />
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
                    </div>
                  </div>

                  {qrCode && connectionStatus === 'DISCONNECTED' && (
                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-white/10">
                      <p className="text-black text-xs font-bold mb-4 uppercase tracking-widest">Escaneie para Conectar</p>
                      <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                      <button 
                        onClick={fetchQRCode}
                        className="mt-4 text-[10px] text-zinc-500 hover:text-primary-purple transition-colors uppercase font-bold"
                      >
                        Atualizar QR Code
                      </button>
                    </div>
                  )}

                  {connectionStatus === 'CONNECTED' && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-bold text-emerald-500">WhatsApp Conectado</span>
                    </div>
                  )}

                  <button 
                    onClick={fetchQRCode}
                    disabled={isFetchingQR || !evolutionConfig.url || !evolutionConfig.key}
                    className="w-full py-3 btn-secondary rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isFetchingQR ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Buscando QR Code...
                      </>
                    ) : connectionStatus === 'CONNECTED' ? 'Reconectar WhatsApp' : 'Conectar WhatsApp'}
                  </button>
                </div>
              </div>

              <div className="glass-card p-8 rounded-[32px] border border-white/5">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-primary-purple/10 flex items-center justify-center">
                    <LinkIcon className="w-6 h-6 text-primary-purple" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Integração n8n</h3>
                    <p className="text-zinc-500 text-sm">Automatize seus sinais com workflows</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">Webhook URL</label>
                    <input 
                      type="text" 
                      placeholder="https://n8n.seu-servidor.com/webhook/..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary-purple outline-none transition-colors"
                      value={n8nConfig.webhook}
                      onChange={(e) => setN8nConfig({webhook: e.target.value})}
                    />
                  </div>
                  <button className="w-full py-3 btn-secondary rounded-xl text-sm font-bold">Salvar Webhook</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'historico' && (
            <motion.div 
              key="historico"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl space-y-4"
            >
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
            </motion.div>
          )}

          {activeTab === 'analise' && (
            <motion.div 
              key="analise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center"
            >
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
                
                <AnimatePresence>
                  {isAssetDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-20 max-h-60 overflow-y-auto"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full text-center"
                  >
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
                  </motion.div>
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
            </motion.div>
          )}

          {activeTab === 'calendario' && (
            <motion.div 
              key="calendario"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl space-y-4"
            >
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
            </motion.div>
          )}

          {activeTab === 'ranking' && (
            <motion.div 
              key="ranking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-2xl"
            >
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
            </motion.div>
          )}

        </AnimatePresence>
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
    </div>
  );
}
