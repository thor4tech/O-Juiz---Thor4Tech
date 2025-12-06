
import React, { useState } from 'react';
import { 
  User, Shield, Smartphone, Bell, Cpu, 
  Wifi, Database, LogIn, Save, RefreshCw, 
  CreditCard, Globe 
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [userName, setUserName] = useState("Agente Visitante");
  const [isLinked, setIsLinked] = useState(false);
  
  // Mock System Stats
  const systemStats = [
    { label: "Status da API Gemini", value: "Operacional", color: "text-emerald-400", icon: Cpu },
    { label: "Latência de Rede", value: "24ms", color: "text-cyan-400", icon: Wifi },
    { label: "Banco de Dados (Supabase)", value: "Conectado (Modo Guest)", color: "text-yellow-400", icon: Database },
  ];

  const handleLinkAccount = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation of linking process
    alert("Simulação: Redirecionando para portal de autenticação corporativa...");
    setIsLinked(true);
    setUserName("Diretor de Operações");
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações do Sistema</h1>
        <p className="text-slate-400">Gerencie sua identidade, conexões e preferências da interface neural.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile & Login Placeholder */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-brand-accent flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <User size={40} className="text-brand-accent" />
              </div>
              <h3 className="text-xl font-bold text-white">{userName}</h3>
              <p className="text-sm text-slate-400 mb-4">{isLinked ? "Acesso Corporativo Nível 5" : "Acesso Temporário (Guest)"}</p>
              
              {!isLinked ? (
                <div className="w-full bg-slate-900/50 p-4 rounded-lg border border-white/5 text-left">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <LogIn size={12} /> Vincular Conta
                  </h4>
                  <form onSubmit={handleLinkAccount} className="space-y-3">
                    <input 
                      type="email" 
                      placeholder="Email Corporativo" 
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-brand-accent focus:outline-none"
                    />
                    <input 
                      type="password" 
                      placeholder="Chave de Acesso" 
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-brand-accent focus:outline-none"
                    />
                    <button type="submit" className="w-full bg-brand-accent hover:bg-brand-accentHover text-white text-sm font-semibold py-2 rounded transition-colors">
                      Conectar
                    </button>
                  </form>
                </div>
              ) : (
                <button 
                  onClick={() => setIsLinked(false)}
                  className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 py-2 rounded text-sm transition-colors"
                >
                  Desconectar Sessão
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
          
          {/* Interface Preferences */}
          <section className="glass-panel p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="text-brand-accent" />
              <h3 className="text-xl font-bold text-white">Preferências de Interface</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-white/5">
                <div>
                  <h4 className="text-white font-medium">Modo de Alta Densidade</h4>
                  <p className="text-sm text-slate-400">Exibir mais informações por tela em listas.</p>
                </div>
                <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-white/5">
                <div>
                  <h4 className="text-white font-medium">Animações de Interface</h4>
                  <p className="text-sm text-slate-400">Reduzir movimentos para economizar GPU.</p>
                </div>
                <div className="w-12 h-6 bg-brand-accent rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Notification Settings */}
          <section className="glass-panel p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="text-brand-accent" />
              <h3 className="text-xl font-bold text-white">Notificações Inteligentes</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Conclusão de Análise', 'Tarefas Críticas', 'Resumo Semanal', 'Alertas de Segurança'].map((item, i) => (
                <label key={i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-brand-accent focus:ring-offset-slate-900" />
                  <span className="text-slate-300">{item}</span>
                </label>
              ))}
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

      <div className="mt-8 text-center text-slate-600 text-xs">
        <p>Thor4Tech Meeting Brain v1.0.4 • Build 2024.05.20</p>
        <p>Powered by Google Gemini 1.5 Flash • Secure Enclave Active</p>
      </div>
    </div>
  );
};
