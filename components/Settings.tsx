import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Smartphone, Bell, Cpu, 
  Wifi, Database, LogIn, Save, RefreshCw, 
  CreditCard, Globe, Key, Cloud, Lock
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [userName, setUserName] = useState("Agente Visitante");
  const [isLinked, setIsLinked] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  // Admin / Blob State
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [blobToken, setBlobToken] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('thor4tech_gemini_key');
    if (storedKey) setApiKey(storedKey);

    const storedBlob = localStorage.getItem('thor4tech_blob_token');
    if (storedBlob) setBlobToken(storedBlob);

    // Auto-login check (simple simulation)
    const adminSession = localStorage.getItem('thor4tech_admin_session');
    if (adminSession === 'true') {
      setIsAdmin(true);
      setUserName("Rafael (Admin)");
      setIsLinked(true);
    }
  }, []);

  const handleSaveKey = () => {
    localStorage.setItem('thor4tech_gemini_key', apiKey);
    alert('Chave API Gemini salva localmente!');
  };

  const handleSaveBlobToken = () => {
    localStorage.setItem('thor4tech_blob_token', blobToken);
    alert('Vercel Blob Token salvo!');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === 'rafael@admin.com' && adminPass === 'admin') {
      setIsAdmin(true);
      setUserName("Rafael (Admin)");
      setIsLinked(true);
      localStorage.setItem('thor4tech_admin_session', 'true');
      alert("Bem-vindo, Rafael. Acesso Admin concedido.");
    } else {
      alert("Credenciais inválidas.");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setIsLinked(false);
    setUserName("Agente Visitante");
    localStorage.removeItem('thor4tech_admin_session');
  }

  // Mock System Stats
  const systemStats = [
    { label: "Gemini 2.5 Flash (Transcrição)", value: "Ativo", color: "text-emerald-400", icon: Cpu },
    { label: "Gemini 3.0 Pro (Inteligência)", value: "Ativo", color: "text-purple-400", icon: Cpu },
    { label: "Vercel Blob Storage", value: blobToken ? "Token Configurado" : "Não Configurado", color: blobToken ? "text-cyan-400" : "text-red-400", icon: Cloud },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações do Sistema</h1>
        <p className="text-slate-400">Gerencie sua identidade, conexões e preferências da interface neural.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile & Login */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-brand-accent flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <User size={40} className="text-brand-accent" />
              </div>
              <h3 className="text-xl font-bold text-white">{userName}</h3>
              <p className="text-sm text-slate-400 mb-4">{isAdmin ? "Administrador do Sistema" : "Acesso Visitante"}</p>
              
              {!isAdmin ? (
                <div className="w-full bg-slate-900/50 p-4 rounded-lg border border-white/5 text-left">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Lock size={12} /> Login Principal (Rafael)
                  </h4>
                  <form onSubmit={handleAdminLogin} className="space-y-3">
                    <input 
                      type="email" 
                      placeholder="Email (rafael@admin.com)" 
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-brand-accent focus:outline-none"
                    />
                    <input 
                      type="password" 
                      placeholder="Senha (admin)" 
                      value={adminPass}
                      onChange={e => setAdminPass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-brand-accent focus:outline-none"
                    />
                    <button type="submit" className="w-full bg-brand-accent hover:bg-brand-accentHover text-white text-sm font-semibold py-2 rounded transition-colors">
                      Acessar Painel Admin
                    </button>
                  </form>
                </div>
              ) : (
                <button 
                  onClick={handleLogout}
                  className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 py-2 rounded text-sm transition-colors"
                >
                  Sair do Modo Admin
                </button>
              )}
            </div>
          </div>

          {/* System Status Small Widget */}
          <div className="glass-panel p-6 rounded-2xl">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Telemetria</h4>
            <div className="space-y-4">
              {systemStats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded bg-slate-900 ${stat.color}`}>
                      <stat.icon size={16} />
                    </div>
                    <span className="text-sm text-slate-300">{stat.label}</span>
                  </div>
                  <span className={`text-xs font-mono ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Settings Options */}
        <div className="lg:col-span-2 space-y-6">

           {/* API KEYS SECTION */}
           <section className="glass-panel p-8 rounded-2xl border border-brand-accent/20">
            <div className="flex items-center gap-3 mb-6">
              <Key className="text-brand-accent" />
              <h3 className="text-xl font-bold text-white">Chaves de Acesso (API)</h3>
            </div>
            
            <div className="space-y-4">
               <div>
                  <label className="block text-sm text-slate-400 mb-1">Gemini API Key (Google AI Studio)</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Cole sua chave aqui (AIza...)" 
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:border-brand-accent focus:outline-none"
                    />
                    <button onClick={handleSaveKey} className="bg-slate-700 hover:bg-slate-600 px-4 rounded text-white"><Save size={18}/></button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Necessário para Transcrição (Flash) e Análise (Pro).</p>
               </div>

               {isAdmin && (
                  <div className="pt-4 border-t border-white/10">
                    <label className="block text-sm text-yellow-400 mb-1 flex items-center gap-2"><Cloud size={14}/> Vercel Blob Token (Read/Write)</label>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        value={blobToken}
                        onChange={(e) => setBlobToken(e.target.value)}
                        placeholder="vercel_blob_rw_..." 
                        className="flex-1 bg-slate-900 border border-yellow-500/30 rounded px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
                      />
                      <button onClick={handleSaveBlobToken} className="bg-yellow-600/20 text-yellow-400 border border-yellow-600/50 hover:bg-yellow-600/40 px-4 rounded"><Save size={18}/></button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Necessário para salvar os arquivos .txt na nuvem.</p>
                  </div>
               )}
            </div>
          </section>
          
          {/* Data Management */}
          <section className="glass-panel p-8 rounded-2xl border border-red-500/10">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-red-400" />
              <h3 className="text-xl font-bold text-white">Zona de Perigo</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Ações irreversíveis relacionadas aos dados locais e em nuvem.
            </p>
            <div className="flex gap-4">
               <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-white/10 transition-colors text-sm">
                 Limpar Cache Local
               </button>
               <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 transition-colors text-sm">
                 Resetar Fábrica
               </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};