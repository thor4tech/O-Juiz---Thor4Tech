
import React from 'react';
import { 
  User, Shield, Cloud, CheckCircle, XCircle, Activity, Server, Cpu
} from 'lucide-react';

export const Settings: React.FC = () => {
  // Verifica as variáveis de ambiente
  const checkEnv = (keys: string[]) => {
    return keys.some(key => process.env[key] || process.env[`NEXT_PUBLIC_${key}`]);
  };

  const envStatus = {
    supabase: checkEnv(['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']),
    gemini: checkEnv(['GEMINI_API_KEY', 'NEXT_PUBLIC_GEMINI_API_KEY']),
    blob: checkEnv(['BLOB_READ_WRITE_TOKEN', 'NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN'])
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in pb-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Centro de Comando</h1>
            <p className="text-slate-400">Diagnóstico e configuração da rede neural Thor4Tech.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-8 rounded-2xl relative overflow-hidden text-center group border border-white/5 hover:border-brand-accent/30 transition-all">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
             
             <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-slate-800 mx-auto mb-4 border-2 border-brand-accent flex items-center justify-center relative z-10">
                    <User size={40} className="text-brand-accent" />
                </div>
                <div className="absolute inset-0 bg-brand-accent/20 blur-xl rounded-full z-0 animate-pulse"></div>
             </div>
             
             <h3 className="text-xl font-bold text-white">Administrador</h3>
             <p className="text-sm text-slate-400 mb-4">Licença Enterprise</p>
             <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full inline-flex items-center gap-1 border border-emerald-500/20">
                <Shield size={10} /> Sistema Seguro
             </div>
          </div>
        </div>

        {/* System Status */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-panel p-8 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <Activity className="text-brand-accent" />
              <h3 className="text-xl font-bold text-white">Status da Conexão Neural</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
               {/* Gemini Status */}
               <StatusCard 
                  icon={<Cpu className="text-purple-400" size={24} />}
                  title="Motor de IA (Gemini Flash + Pro)"
                  desc="Processamento Híbrido Ativado"
                  active={envStatus.gemini}
               />

               {/* Database Status */}
               <StatusCard 
                  icon={<Shield className="text-emerald-400" size={24} />}
                  title="Banco de Dados Supabase"
                  desc="Sincronização em Tempo Real"
                  active={envStatus.supabase}
               />

               {/* Cloud Status */}
               <StatusCard 
                  icon={<Cloud className="text-cyan-400" size={24} />}
                  title="Vercel Blob Storage"
                  desc="Armazenamento de Longo Prazo (JSON)"
                  active={envStatus.blob}
               />
            </div>

            {(!envStatus.gemini || !envStatus.supabase) && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-300 text-sm">
                 <div className="p-1 bg-red-500/20 rounded-full mt-0.5"><XCircle size={14}/></div>
                 <div>
                    <strong className="block text-red-200 mb-1">Atenção: Variáveis de Ambiente Ausentes</strong>
                    O sistema está operando em modo degradado. Verifique as configurações no Vercel (Environment Variables).
                 </div>
              </div>
            )}
          </section>
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
                {active ? 'CONECTADO' : 'OFFLINE'}
            </span>
            {active ? <CheckCircle className="text-emerald-500" size={18} /> : <XCircle className="text-red-500" size={18} />}
        </div>
    </div>
);
