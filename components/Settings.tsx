
import React, { useState, useEffect } from 'react';
import { User, Shield, Cloud, CheckCircle, XCircle, Activity, Cpu, Database, Save, AlertTriangle } from 'lucide-react';

export const Settings: React.FC = () => {
  const [showRescueMode, setShowRescueMode] = useState(false);
  const [keys, setKeys] = useState({
    supabaseUrl: '',
    supabaseKey: '',
    geminiKey: '',
    blobToken: ''
  });

  // Load existing override keys on mount
  useEffect(() => {
    setKeys({
      supabaseUrl: localStorage.getItem('THOR_OVERRIDE_SUPABASE_URL') || '',
      supabaseKey: localStorage.getItem('THOR_OVERRIDE_SUPABASE_ANON_KEY') || '',
      geminiKey: localStorage.getItem('THOR_OVERRIDE_GEMINI_API_KEY') || '',
      blobToken: localStorage.getItem('THOR_OVERRIDE_BLOB_READ_WRITE_TOKEN') || ''
    });
  }, []);

  const handleSaveKeys = () => {
    if (keys.supabaseUrl) localStorage.setItem('THOR_OVERRIDE_SUPABASE_URL', keys.supabaseUrl);
    if (keys.supabaseKey) localStorage.setItem('THOR_OVERRIDE_SUPABASE_ANON_KEY', keys.supabaseKey);
    if (keys.geminiKey) localStorage.setItem('THOR_OVERRIDE_GEMINI_API_KEY', keys.geminiKey);
    if (keys.blobToken) localStorage.setItem('THOR_OVERRIDE_BLOB_READ_WRITE_TOKEN', keys.blobToken);
    
    alert('Chaves salvas! O sistema será reiniciado para aplicar as novas conexões.');
    window.location.reload();
  };

  const handleClearKeys = () => {
    localStorage.removeItem('THOR_OVERRIDE_SUPABASE_URL');
    localStorage.removeItem('THOR_OVERRIDE_SUPABASE_ANON_KEY');
    localStorage.removeItem('THOR_OVERRIDE_GEMINI_API_KEY');
    localStorage.removeItem('THOR_OVERRIDE_BLOB_READ_WRITE_TOKEN');
    window.location.reload();
  };

  // Check actual active keys (Env OR LocalStorage)
  const getActiveKey = (key: string, overrideKey: string) => {
    return localStorage.getItem(overrideKey) || 
           process.env[key] || 
           process.env[`NEXT_PUBLIC_${key}`];
  };

  const status = {
    supabase: !!getActiveKey('SUPABASE_URL', 'THOR_OVERRIDE_SUPABASE_URL') && !!getActiveKey('SUPABASE_ANON_KEY', 'THOR_OVERRIDE_SUPABASE_ANON_KEY'),
    gemini: !!getActiveKey('GEMINI_API_KEY', 'THOR_OVERRIDE_GEMINI_API_KEY'),
    blob: !!getActiveKey('BLOB_READ_WRITE_TOKEN', 'THOR_OVERRIDE_BLOB_READ_WRITE_TOKEN')
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Centro de Comando</h1>
        <p className="text-slate-400">Diagnóstico e configuração da rede neural Thor4Tech.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-8 rounded-2xl relative overflow-hidden text-center group border border-white/5 hover:border-brand-accent/30 transition-all">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
             <div className="w-24 h-24 rounded-full bg-slate-800 mx-auto mb-4 border-2 border-brand-accent flex items-center justify-center relative z-10">
                 <User size={40} className="text-brand-accent" />
             </div>
             <h3 className="text-xl font-bold text-white">Administrador</h3>
             <p className="text-sm text-slate-400 mb-4">Licença Enterprise</p>
             <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full inline-flex items-center gap-1 border border-emerald-500/20">
                <Shield size={10} /> Sistema Seguro
             </div>
          </div>
          
          <button 
             onClick={() => setShowRescueMode(!showRescueMode)}
             className="w-full py-3 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-colors flex items-center justify-center gap-2"
          >
             <AlertTriangle size={16} />
             {showRescueMode ? 'Ocultar Configuração Manual' : 'Configuração de Emergência'}
          </button>
        </div>

        {/* Diagnostics & Manual Config */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-panel p-8 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <Activity className="text-brand-accent" />
              <h3 className="text-xl font-bold text-white">Status da Conexão Neural</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
               <StatusCard 
                  icon={<Cpu className="text-purple-400" size={24} />}
                  title="Motor de IA (Gemini Flash + Pro)"
                  desc={status.gemini ? "Operacional" : "OFFLINE: Chave API ausente"}
                  active={status.gemini}
               />

               <StatusCard 
                  icon={<Database className="text-emerald-400" size={24} />}
                  title="Banco de Dados Supabase"
                  desc={status.supabase ? "Operacional" : "OFFLINE: Credenciais ausentes"}
                  active={status.supabase}
               />

               <StatusCard 
                  icon={<Cloud className="text-cyan-400" size={24} />}
                  title="Vercel Blob Storage"
                  desc={status.blob ? "Operacional" : "OFFLINE: Token ausente"}
                  active={status.blob}
               />
            </div>
          </section>

          {showRescueMode && (
            <section className="glass-panel p-8 rounded-2xl border border-yellow-500/30 bg-yellow-900/5 animate-fade-in">
                <div className="flex items-center gap-2 mb-4 text-yellow-500">
                    <AlertTriangle size={20} />
                    <h3 className="font-bold">Modo de Resgate (Override Manual)</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">
                    Se o Vercel não estiver injetando as variáveis corretamente, cole suas chaves aqui. Elas serão salvas no navegador localmente e terão prioridade.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-mono text-slate-500 mb-1">SUPABASE_URL</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white text-sm font-mono focus:border-yellow-500 outline-none"
                            placeholder="https://..."
                            value={keys.supabaseUrl}
                            onChange={e => setKeys({...keys, supabaseUrl: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-slate-500 mb-1">SUPABASE_ANON_KEY</label>
                        <input 
                            type="password" 
                            className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white text-sm font-mono focus:border-yellow-500 outline-none"
                            placeholder="eyJ..."
                            value={keys.supabaseKey}
                            onChange={e => setKeys({...keys, supabaseKey: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-slate-500 mb-1">GEMINI_API_KEY</label>
                        <input 
                            type="password" 
                            className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white text-sm font-mono focus:border-yellow-500 outline-none"
                            placeholder="AIza..."
                            value={keys.geminiKey}
                            onChange={e => setKeys({...keys, geminiKey: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-slate-500 mb-1">BLOB_READ_WRITE_TOKEN</label>
                        <input 
                            type="password" 
                            className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white text-sm font-mono focus:border-yellow-500 outline-none"
                            placeholder="vercel_blob_rw_..."
                            value={keys.blobToken}
                            onChange={e => setKeys({...keys, blobToken: e.target.value})}
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={handleSaveKeys}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> Salvar & Conectar Agora
                        </button>
                        <button 
                            onClick={handleClearKeys}
                            className="px-4 py-3 border border-white/10 text-slate-400 hover:text-white rounded-lg"
                            title="Limpar configurações manuais"
                        >
                            <XCircle size={18} />
                        </button>
                    </div>
                </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusCard: React.FC<{icon: React.ReactNode, title: string, desc: string, active: boolean}> = ({icon, title, desc, active}) => (
    <div className={`p-5 rounded-xl flex items-center justify-between border transition-all ${active ? 'bg-slate-900/50 border-white/5' : 'bg-red-900/10 border-red-500/20'}`}>
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${active ? 'bg-slate-800' : 'bg-red-500/10'}`}>
                {icon}
            </div>
            <div>
                <p className={`text-sm font-bold ${active ? 'text-white' : 'text-red-200'}`}>{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-xs font-mono ${active ? 'text-emerald-500' : 'text-red-500'}`}>
                {active ? 'ONLINE' : 'OFFLINE'}
            </span>
            {active ? <CheckCircle className="text-emerald-500" size={18} /> : <XCircle className="text-red-500" size={18} />}
        </div>
    </div>
);
