const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Replace analise block lines 225-417 (index 224 to 416) it's 193 lines
content.splice(224, 193, '              {activeTab === "analise" && <DashboardNexus />}');

// Replace state definition block lines 63-71 (index 62 to 70) it's 9 lines
content.splice(62, 9, 
'  const [showDashboard, setShowDashboard] = useState(false);',
'  const [activeTab, setActiveTab] = useState<Tab>("analise");',
'  const [liveSignal, setLiveSignal] = useState<any>(null);',
'  const [liveHistory, setLiveHistory] = useState<any[]>([]);',
'  const [gatekeeperClicks, setGatekeeperClicks] = useState(0);',
'  const [userPlan, setUserPlan] = useState("LITE");',
'  const [n8nConfig, setN8nConfig] = useState({ webhook: "" });',
'  const getTVSymbol = (asset: string) => asset?.replace("/", "") || "EURUSD";',
'',
'  useEffect(() => {',
'    console.log("Vision AI: App Component Mounted");',
'  }, []);',
'',
'  return (',
'    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">'
);

// Add import
content.splice(13, 0, 'import DashboardNexus from "./DashboardNexus";');

fs.writeFileSync('src/App.tsx', content.join('\n'));
console.log('App.tsx patched successfully.');
