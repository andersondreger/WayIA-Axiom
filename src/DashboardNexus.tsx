import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function DashboardNexus() {
  const [signals, setSignals] = useState<any[]>([]);
  const [currentAsset, setCurrentAsset] = useState("BUSCANDO");

  useEffect(() => {
    async function loadSignals() {
      const { data } = await supabase
        .from('live_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (data && data.length > 0) {
        setSignals(data);
        setCurrentAsset(data[0]?.par || "BUSCANDO");
      }
    }

    loadSignals();
    const interval = setInterval(loadSignals, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#050505] min-h-screen text-[#e2e8f0] font-mono p-4 md:p-10" style={{ fontFamily: "'Fira Code', monospace" }}>
      <style>{`
        .glass { background: rgba(15, 15, 15, 0.7); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .neon-cyan { color: #00ffff; text-shadow: 0 0 10px #00ffff; }
        .gold-glow { color: #ffd700; text-shadow: 0 0 15px #ffd700; }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        .nexus-pulse { animation: pulse 2s infinite; }
      `}</style>
      
      <div className="max-w-6xl mx-auto">
        <nav className="flex justify-between items-center mb-8 glass p-6 rounded-2xl">
          <h1 className="text-xl font-bold tracking-widest">AXIOM<span className="gold-glow">PRIME</span></h1>
          <div className="text-[10px] text-right">
            <span className="block text-gray-500">ENGINE STATUS</span>
            <span className="neon-cyan nexus-pulse">● SYNCED WITH SUPABASE</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass rounded-3xl p-10 flex flex-col items-center justify-center text-center">
            <div className="w-40 h-40 border-2 border-dashed border-yellow-500/30 rounded-full flex items-center justify-center mb-6 animate-spin-slow">
              <div id="status-circle" className="w-32 h-32 rounded-full border border-cyan-500/20 flex items-center justify-center">
                <span className="text-xs gold-glow">{currentAsset}</span>
              </div>
            </div>
            <p className="text-[10px] tracking-[0.3em] uppercase">Monitoramento Ativo</p>
          </div>

          <div className="lg:col-span-2 glass rounded-3xl p-8">
            <h2 className="text-xs mb-6 text-gray-500 tracking-widest uppercase">The Nexus Live Feed</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-600 border-b border-gray-800 text-left">
                    <th className="pb-4">HORA</th>
                    <th className="pb-4">ATIVO</th>
                    <th className="pb-4">AÇÃO</th>
                    <th className="pb-4">CONF.</th>
                    <th className="pb-4 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((s, i) => (
                    <tr key={i} className="border-b border-gray-900/50 hover:bg-white/5 transition">
                      <td className="py-4 text-gray-500">{new Date(s.created_at).toLocaleTimeString('pt-BR')}</td>
                      <td className="py-4 font-bold neon-cyan">{s.par}</td>
                      <td className={`py-4 ${s.acao.includes('COMPRAR') ? 'text-green-400' : 'text-red-400'}`}>{s.acao}</td>
                      <td className="py-4">{s.confianca}</td>
                      <td className="py-4 text-right gold-glow font-bold italic">{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
