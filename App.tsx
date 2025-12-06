
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { transcribeAudio, generateActionPlan } from './services/geminiService';
import { uploadAnalysisToBlob } from './services/blobService';
import { Dashboard } from './components/Dashboard';
import { Recorder } from './components/Recorder';
import { MeetingDetails } from './components/MeetingDetails';
import { Settings } from './components/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Meeting, AppView, MeetingAnalysis } from './types';
import { Zap, LayoutGrid, Settings as SettingsIcon } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');

  // ID genérico para identificar o usuário neste dispositivo
  const GUEST_ID = 'user-device-v1';

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setMeetings(data as Meeting[]);
      
    } catch (e) {
      console.warn("Modo Offline: Não foi possível sincronizar com o Supabase.", e);
      // Aqui você poderia carregar de localStorage se quisesse persistência offline
    }
  };

  const handleProcessMeeting = async (audioBlob: Blob, duration: number) => {
    // 1. CRIAÇÃO IMEDIATA DO REGISTRO (Proteção contra crash)
    const draftId = crypto.randomUUID();
    const draftMeeting: Meeting = {
      id: draftId,
      user_id: GUEST_ID,
      title: "Processando nova reunião...",
      duration_seconds: duration,
      status: 'processing',
      created_at: new Date().toISOString(),
      analysis_json: undefined
    };

    // Atualiza UI instantaneamente (Optimistic Update)
    setMeetings(prev => [draftMeeting, ...prev]);
    setIsProcessing(true);
    setCurrentView(AppView.DASHBOARD); // Envia usuário para Dashboard para ver o progresso

    try {
      // 2. SALVAR RASCUNHO NO DB (Se falhar a IA, o registro existe)
      await supabase.from('meetings').insert([draftMeeting]);

      // 3. TRANSCRIÇÃO (Modelo Flash - Rápido)
      console.log("Iniciando transcrição...");
      const transcription = await transcribeAudio(audioBlob);
      
      // Atualiza estado local parcial
      draftMeeting.transcription_text = transcription;
      draftMeeting.title = "Analisando conteúdo...";
      setMeetings(prev => prev.map(m => m.id === draftId ? { ...draftMeeting } : m));

      // 4. INTELIGÊNCIA (Modelo Pro - Smart)
      console.log("Gerando plano de ação...");
      const analysis = await generateActionPlan(transcription);
      
      // 5. UPLOAD DE BACKUP (Blob) - Não bloqueante
      uploadAnalysisToBlob(analysis).catch(err => console.warn("Blob falhou, mas seguimos:", err));

      // 6. FINALIZAÇÃO
      const finalMeeting: Meeting = {
        ...draftMeeting,
        title: analysis.title_sugestion || "Reunião Finalizada",
        status: 'completed',
        transcription_text: transcription,
        analysis_json: analysis
      };

      // 7. ATUALIZAÇÃO FINAL NO DB
      const { error } = await supabase
        .from('meetings')
        .update({
            title: finalMeeting.title,
            status: 'completed',
            transcription_text: transcription,
            analysis_json: analysis
        })
        .eq('id', draftId);

      if (error) throw error;

      // Atualiza UI Final
      setMeetings(prev => prev.map(m => m.id === draftId ? finalMeeting : m));

    } catch (error: any) {
      console.error("ERRO CRÍTICO NO PROCESSO:", error);
      
      // Marca como falha na UI e no Banco, mas não perde o registro
      const failedMeeting: Meeting = {
        ...draftMeeting,
        status: 'failed',
        title: "Erro no Processamento (Tente Novamente)",
        transcription_text: "Ocorreu um erro durante a análise da IA. " + (error.message || "")
      };

      setMeetings(prev => prev.map(m => m.id === draftId ? failedMeeting : m));
      
      await supabase.from('meetings').update({ 
          status: 'failed',
          title: "Falha na Análise" 
      }).eq('id', draftId);

      alert("Houve uma falha na inteligência da IA. O registro foi salvo como rascunho.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if(!confirm("Tem certeza que deseja apagar esta missão? A ação é irreversível.")) return;
    
    // Atualiza UI primeiro
    setMeetings(prev => prev.filter(m => m.id !== id));
    if (selectedMeeting?.id === id) {
      setSelectedMeeting(null);
      setCurrentView(AppView.DASHBOARD);
    }

    // Sincroniza DB
    await supabase.from('meetings').delete().eq('id', id);
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-brand-accent selection:text-white overflow-hidden">
        {/* Sidebar Estilo Nano Banana */}
        <aside className="fixed left-0 top-0 h-full w-20 md:w-64 glass-panel border-r border-white/5 z-50 flex flex-col items-center md:items-start py-8 transition-all shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
          <div className="mb-12 px-0 md:px-8 flex items-center gap-3 group cursor-default">
            <div className="p-2 bg-brand-accent/10 rounded-lg group-hover:bg-brand-accent/20 transition-colors neon-border">
                <Zap className="text-brand-accent shrink-0" size={28} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tighter hidden md:block text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                THOR4TECH
            </span>
          </div>

          <nav className="flex-1 w-full space-y-2 px-2 md:px-4">
            <NavButton 
                active={currentView === AppView.DASHBOARD} 
                onClick={() => setCurrentView(AppView.DASHBOARD)}
                icon={<LayoutGrid size={22} />}
                label="Painel Tático"
            />
            
            <NavButton 
                active={currentView === AppView.RECORDER} 
                onClick={() => setCurrentView(AppView.RECORDER)}
                icon={<Zap size={22} />}
                label="Nova Missão"
                isAction
            />

            <NavButton 
                active={currentView === AppView.SETTINGS} 
                onClick={() => setCurrentView(AppView.SETTINGS)}
                icon={<SettingsIcon size={22} />}
                label="Sistema"
            />
          </nav>

          <div className="w-full px-6 pb-4 hidden md:block">
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-black border border-white/5">
                  <p className="text-xs text-slate-500 mb-2">Status do Sistema</p>
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-mono text-emerald-400">ONLINE</span>
                  </div>
              </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8 relative min-h-screen overflow-y-auto scrollbar-hide">
          {/* Ambient Background Effects */}
          <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 max-w-7xl mx-auto pt-4 pb-20">
            {currentView === AppView.DASHBOARD && (
              <Dashboard 
                meetings={meetings} 
                onSelectMeeting={(m) => { 
                   if (m.status === 'completed') {
                      setSelectedMeeting(m); 
                      setCurrentView(AppView.DETAILS); 
                   } else if (m.status === 'failed') {
                      alert("Esta reunião falhou no processamento. Tente apagar e gravar novamente.");
                   } else {
                     // Não faz nada se estiver processando, o card já mostra o loader
                   }
                }}
                onDeleteMeeting={handleDeleteMeeting}
                onNewMeeting={() => setCurrentView(AppView.RECORDER)}
              />
            )}

            {currentView === AppView.RECORDER && (
              <div className="flex flex-col items-center justify-center min-h-[75vh] animate-fade-in">
                <Recorder onProcess={handleProcessMeeting} isProcessing={isProcessing} />
              </div>
            )}

            {currentView === AppView.DETAILS && selectedMeeting && (
              <MeetingDetails 
                meeting={selectedMeeting} 
                onBack={() => setCurrentView(AppView.DASHBOARD)} 
              />
            )}

            {currentView === AppView.SETTINGS && (
              <Settings />
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

// Componente auxiliar para Botões do Menu
const NavButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isAction?: boolean}> = ({active, onClick, icon, label, isAction}) => (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
        ${active 
            ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
            : 'hover:bg-white/5 text-slate-400 hover:text-white border border-transparent'
        }
      `}
    >
      <div className={`relative ${isAction && !active ? 'text-cyan-400' : ''}`}>
         {isAction && active && <div className="absolute inset-0 bg-cyan-400 blur-md opacity-40"></div>}
         {icon}
      </div>
      <span className={`hidden md:block font-medium ${active ? 'text-white' : ''}`}>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_5px_currentColor] hidden md:block"></div>}
    </button>
);

export default App;
