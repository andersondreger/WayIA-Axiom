const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
const code = fs.readFileSync(appPath, 'utf-8');

// Find the exact return statement where the JSX starts
const returnIndex = code.indexOf('  return (');

if (returnIndex === -1) {
    console.error("Could not find the return statement to replace. Make sure the file hasn't been modified unexpectedly.");
    process.exit(1);
}

const head = code.substring(0, returnIndex);

const newTail = `  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {!showDashboard ? (
        <div id="welcome-screen" className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
          {/* Welcome Screen (Mantida Escura para impacto inicial) */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.8">
                {Array.from({ length: 120 }).map((_, i) => (
                  <path
                    key={\`left-\${i}\`}
                    d={\`M -100 \${800 - i * 8} Q \${400} \${400}, 1600 \${400 + (i - 60) * 15}\`}
                    stroke="#8B5CF6"
                    strokeWidth="0.4"
                    strokeOpacity={0.05 + (i / 120) * 0.3}
                  />
                ))}
              </g>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center p-6 max-w-lg w-full md:w-1/2 md:mr-auto md:ml-24">
            <div className="mb-12 animate-float">
              <img 
                src="https://xzlotpwqpdjwzqerdyfb.supabase.co/storage/v1/object/public/WayIA/logoatu-removebg-preview.png" 
                alt="Logo" 
                className="h-32 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-white">
              VISION AI
            </h1>
            
            <p className="text-zinc-400 text-lg mb-12 leading-relaxed font-medium">
              A inteligência artificial mais avançada para detecção de sinais em tempo real.
            </p>

            <button 
              onClick={() => setShowDashboard(true)}
              className="px-12 py-5 bg-white text-black hover:bg-gray-100 rounded-2xl font-black text-lg tracking-widest uppercase transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              Acesse o Dashboard
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Bottom Nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-50">
            {[
              { id: 'analise', icon: LineChart, label: 'Análise' },
              { id: 'historico', icon: History, label: 'Histórico' },
              { id: 'gestao', icon: Wallet, label: 'Gestão' },
              { id: 'planos', icon: Crown, label: 'VIP' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={\`flex flex-col items-center gap-1 transition-all \${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}\`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold tracking-widest">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Desktop Left Sidebar (SaaS Style) */}
          <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[#0F172A] text-slate-300 border-r border-slate-800 z-40">
            <div className="h-16 flex items-center px-6 border-b border-white/5">
               <img 
                 src="https://xzlotpwqpdjwzqerdyfb.supabase.co/storage/v1/object/public/WayIA/logoatu-removebg-preview.png" 
                 alt="Logo" 
                 className="h-8 w-auto object-contain drop-shadow-md brightness-200"
                 referrerPolicy="no-referrer"
               />
               <span className="ml-3 font-bold text-white tracking-widest">AXIOM</span>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-3 block px-2">Main Menu</span>
                <ul className="space-y-1">
                  <li>
                    <button onClick={() => setActiveTab('analise')} className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors \${activeTab === 'analise' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-300'}\`}>
                      <LineChart className="w-4 h-4" /> Dashboard
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveTab('historico')} className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors \${activeTab === 'historico' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-300'}\`}>
                      <History className="w-4 h-4" /> Live History
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveTab('calendario')} className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors \${activeTab === 'calendario' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-300'}\`}>
                      <Calendar className="w-4 h-4" /> Calendário
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-3 block px-2">Management</span>
                <ul className="space-y-1">
                  <li>
                    <button onClick={() => setActiveTab('gestao')} className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors \${activeTab === 'gestao' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'}\`}>
                      <Wallet className="w-4 h-4" /> Integrações (n8n)
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveTab('ranking')} className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors \${activeTab === 'ranking' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'}\`}>
                      <Trophy className="w-4 h-4" /> Team Ranking
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-white/5">
               <button onClick={() => setActiveTab('planos')} className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-indigo-400" />
                    <div className="text-left">
                      <div className="text-sm font-bold text-white">Plan {userPlan}</div>
                      <div className="text-[10px] text-indigo-300">View Upgrade</div>
                    </div>
                  </div>
               </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 overflow-y-auto bg-slate-50">
            {/* Topbar */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight capitalize">{activeTab === 'analise' ? 'Dashboard Overview' : activeTab}</h2>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end mr-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status Sync</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-medium text-slate-600">Realtime Active</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                  <User className="w-5 h-5" />
                </div>
              </div>
            </header>

            <main className="flex-1 p-4 lg:p-8">
              {activeTab === 'analise' && (
                <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
                  
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Signals Today</span>
                        <Activity className="w-4 h-4 text-indigo-500" />
                      </div>
                      <span className="text-3xl font-black text-slate-800">{liveHistory.length}</span>
                      <span className="text-[10px] font-medium text-emerald-500 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Live
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Market Flow</span>
                        <Target className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-lg font-bold text-slate-800 truncate">{liveSignal?.status_mercado || 'IDEAL'}</span>
                      <span className="text-[10px] font-medium text-slate-400 mt-1">Status Overview</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">AI Confidence</span>
                        <Zap className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-800">{liveSignal?.confianca || 92}</span>
                        <span className="text-sm font-bold text-slate-500">%</span>
                      </div>
                      <span className="text-[10px] font-medium text-emerald-500 mt-1">+4% vs last week</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Last Asset</span>
                        <LineChart className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-2xl font-black text-slate-800 tracking-tight">{liveSignal?.par || 'EUR/USD'}</span>
                      <span className="text-[10px] font-medium text-slate-400 mt-1">Active Pairs</span>
                    </div>
                  </div>

                  {/* Main Grid: Chart & AI Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Col: Chart */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 min-h-[500px] flex flex-col relative w-full overflow-hidden">
                      <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-bold text-slate-800 text-sm">Market Trend Analysis</h3>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] rounded font-bold uppercase">Live Tracker</span>
                        </div>
                      </div>
                      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-100 bg-[#f8f9fa]">
                        <iframe src={\`https://s.tradingview.com/widgetembed/?symbol=\${getTVSymbol(liveSignal?.par)}&interval=1&theme=light\`} 
                                className="w-full h-full border-none pointer-events-auto"></iframe>
                      </div>
                    </div>

                    {/* Right Col: AI Summary (The Sniper) */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col relative z-20">
                      {/* Gatekeeper Overlay */}
                      {userPlan === 'LITE' && gatekeeperClicks >= 6 && (
                        <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-3xl">
                          <Crown className="w-12 h-12 text-indigo-500 mb-4 animate-pulse" />
                          <h3 className="text-xl font-bold text-slate-800 mb-2">Daily Review Limit</h3>
                          <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">You analyzed 6 signals today. Upgrade to PRO for unlimited 24/7 AI access.</p>
                          <button onClick={() => setActiveTab('planos')} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(79,70,229,0.4)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.6)] focus:scale-95 transition-all">
                            Upgrade to PRO
                          </button>
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 text-sm">AI Signal Summary</h3>
                        {liveSignal?.confianca > 90 && (
                          <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded animate-pulse">HIGH CONFIDENCE</span>
                        )}
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between py-3 border-b border-slate-100">
                          <span className="text-xs font-semibold text-slate-500">Risk Zone</span>
                          {liveSignal?.status_mercado === 'AGUARDAR' ? (
                            <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1"><AlertCircle className="w-3 h-3"/> High Risk</span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Medium 2.3</span>
                          )}
                        </div>
                        <div className="flex justify-between py-3 border-b border-slate-100">
                          <span className="text-xs font-semibold text-slate-500">Asset Targeted</span>
                          <span className="text-sm font-black text-slate-800">{liveSignal?.par || 'Waiting...'}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-slate-100">
                          <span className="text-xs font-semibold text-slate-500">AI Confidence</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 transition-all duration-1000" style={{width: \`\${liveSignal?.confianca || 0}%\`}}></div>
                            </div>
                            <span className="text-xs font-bold text-indigo-600">{liveSignal?.confianca ? \`\${liveSignal.confianca}%\` : '--'}</span>
                          </div>
                        </div>
                        <div className="flex justify-between py-3">
                          <span className="text-xs font-semibold text-slate-500">Entry Rate</span>
                          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{liveSignal?.taxa || '0.000'}</span>
                        </div>
                      </div>

                      <div className="mt-auto bg-indigo-50/80 rounded-2xl p-5 border border-indigo-100 relative shadow-inner">
                        <div className="absolute -top-3 left-5 bg-white px-3 py-0.5 rounded-full text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1 border border-indigo-100 shadow-sm">
                          <Zap className="w-3 h-3"/> Recommendation
                        </div>
                        <p className="text-xs text-indigo-900/70 mt-3 mb-5 font-medium leading-relaxed">
                          Based on volume and AI pattern recognition, we suggest the following action.
                        </p>
                        
                        {liveSignal?.status_mercado === 'AGUARDAR' ? (
                           <button disabled className="w-full py-4 bg-slate-200 text-slate-400 rounded-xl font-bold text-sm tracking-wide cursor-not-allowed uppercase">
                             Wait for conditions
                           </button>
                        ) : (
                           <button 
                             onClick={() => setGatekeeperClicks(prev => prev + 1)}
                             className={\`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0.5 text-white flex items-center justify-center gap-2
                               \${liveSignal?.acao?.includes('COMPRA') || liveSignal?.acao?.includes('CALL') ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 
                                 liveSignal?.acao?.includes('VENDA') || liveSignal?.acao?.includes('PUT') ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' : 'bg-slate-800'}\`
                             }
                           >
                             Execute {liveSignal?.acao || 'ANALYSIS'}
                           </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Table: Signal History */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden w-full relative z-10">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">Relevant Signals</h3>
                      <button onClick={() => setActiveTab('historico')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All</button>
                    </div>
                    {liveHistory.length === 0 ? (
                      <div className="p-12 text-center">
                        <History className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-500">No signals registered yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-slate-50/50">
                              <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">Asset Target</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">Rate</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">Strategy</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100 text-right">Confidence</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {liveHistory.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex flex-shrink-0 items-center justify-center">
                                      <LineChart className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <span className="font-bold text-sm text-slate-800">{item.par}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">{item.taxa}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={\`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                    \${item.acao?.includes('COMPRA') || item.acao?.includes('CALL') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}\`}>
                                    {item.acao}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-sm font-bold text-slate-700">{item.confianca ? \`\${item.confianca}%\` : '---'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aba Planos re-estilizada */}
              {activeTab === 'planos' && (
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col hover:border-indigo-200 transition-colors">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Vision LITE</h3>
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-black text-slate-900">R$ 39,69</span>
                      <span className="text-slate-500 font-medium">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                      <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> 10 signals / day</li>
                      <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Basic technical analysis</li>
                      <li className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Community Support</li>
                    </ul>
                    <button className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors">Current Plan</button>
                  </div>
                  
                  <div className="bg-[#111827] p-8 rounded-3xl shadow-xl flex flex-col text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] rounded-full group-hover:bg-indigo-500/30 transition-colors"></div>
                    <div className="absolute top-5 right-5 bg-indigo-500 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold">Recommended</div>
                    <h3 className="text-xl font-bold mb-2">Vision PRO</h3>
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-black">R$ 147,93</span>
                      <span className="text-slate-400 font-medium">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                      <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 className="w-5 h-5 text-indigo-400" /> Unlimited 24/7 Signals</li>
                      <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 className="w-5 h-5 text-indigo-400" /> 95%+ High Precision AI</li>
                      <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 className="w-5 h-5 text-indigo-400" /> Integration n8n/Evolution</li>
                      <li className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 className="w-5 h-5 text-indigo-400" /> VIP Private Support</li>
                    </ul>
                    <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg">Upgrade to PRO</button>
                  </div>
                </div>
              )}

              {/* Aba Gestão re-estilizada */}
              {activeTab === 'gestao' && (
                <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                          <Zap className="w-6 h-6 text-indigo-600" />
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-slate-800">n8n Webhook Integration</h3>
                          <p className="text-sm text-slate-500">Link your automation workflows</p>
                       </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Webhook Endpoint URL</label>
                        <input 
                          type="text" 
                          placeholder="https://n8n.sua-api.com/webhook"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700 font-mono"
                          value={n8nConfig.webhook}
                          onChange={(e) => setN8nConfig({webhook: e.target.value})}
                        />
                      </div>
                      <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-indigo-700 transition-colors shadow-md">Save Configuration</button>
                    </div>
                  </div>
                  
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center opacity-70">
                     <Wallet className="w-8 h-8 text-slate-300 mb-3" />
                     <h4 className="text-slate-800 font-bold mb-1">Evolution API (WhatsApp)</h4>
                     <p className="text-xs text-slate-500 mb-4 max-w-sm">Manage your WhatsApp instances for notification delivery.</p>
                     <button className="px-6 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg">Configure Access</button>
                  </div>
                </div>
              )}
              
              {/* Fallback Restante */}
              {['historico', 'calendario', 'ranking'].includes(activeTab) && (
                <div className="max-w-4xl mx-auto bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center animate-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-100 shadow-sm">
                    {activeTab === 'historico' && <History className="w-6 h-6 text-indigo-400" />}
                    {activeTab === 'calendario' && <Calendar className="w-6 h-6 text-indigo-400" />}
                    {activeTab === 'ranking' && <Trophy className="w-6 h-6 text-indigo-400" />}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2 capitalize tracking-tight">{activeTab} Details</h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">This module has been structurally migrated to the new SaaS framework and will receive specific layout enhancements soon.</p>
                </div>
              )}

            </main>
          </div>
        </>
      )}
    </div>
  );
}
`;

fs.writeFileSync(appPath, head + newTail);
console.log("App.tsx successfully updated with new Layout!");
