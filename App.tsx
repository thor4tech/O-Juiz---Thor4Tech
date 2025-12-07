
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { transcribeAudio, generateActionPlan } from './services/geminiService';
import { uploadAnalysisToBlob, uploadFile } from './services/blobService';
import { Dashboard } from './components/Dashboard';
import { Recorder } from './components/Recorder';
import { MeetingDetails } from './components/MeetingDetails';
import { Settings } from './components/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Meeting, AppView } from './types';
import { Zap, LayoutGrid, Settings as SettingsIcon, CloudOff } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'thor4tech_meetings_backup';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const GUEST_ID = 'user-device-v1';

  useEffect(() => {
    loadMeetings();
  }, []);

  const saveToLocalStorage = (newMeetings: Meeting[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newMeetings));
  };

  const loadMeetings = async () => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      try {
        setMeetings(JSON.parse(localData));
      } catch (e) { console.error(e); }
    }

    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setMeetings(data as Meeting[]);
        saveToLocalStorage(data as Meeting[]);
        setIsOffline(false);
      }
    } catch (e) {
      console.warn("Offline Mode:", e);
      setIsOffline(true);
    }
  };

  const handleProcessMeeting = async (audioBlob: Blob, duration: number) => {
    if (isProcessing) return; 
    setIsProcessing(true); // INÍCIO DO PROCESSO
    setCurrentView(AppView.DASHBOARD);
    
    // 1. RASCUNHO (Feedback Imediato)
    const draftId = crypto.randomUUID();
    const draftMeeting: Meeting = {
      id: draftId,
      user_id: GUEST_ID,
      title: "Processando Gravação...",
      duration_seconds: duration,
      status: 'processing',
      created_at: new Date().toISOString(),
      analysis_json: undefined,
      audio_url: undefined
    };

    // Atualiza estado local imediatamente
    let updatedMeetings = [draftMeeting, ...meetings];
    setMeetings(updatedMeetings);
    saveToLocalStorage(updatedMeetings);

    try {
      // 2. UPLOAD ÁUDIO
      // Passo crítico: Salvar o áudio antes de qualquer risco de falha da IA
      console.log("Iniciando upload do áudio...");
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const audioUrl = await uploadFile(audioBlob, `rec-${draftId}-${dateStr}.webm`);
      
      if (audioUrl) {
         draftMeeting.audio_url = audioUrl;
         updatedMeetings = updatedMeetings.map(m => m.id === draftId ? { ...draftMeeting } : m);
         setMeetings(updatedMeetings);
      }

      // 3. SALVA RASCUNHO NO BANCO
      await supabase.from('meetings').insert([draftMeeting]);

      // 4. TRANSCRIÇÃO (Gemini)
      // Se falhar aqui, cai no catch, mas o áudio já está salvo
      console.log("Enviando para Transcrição...");
      const transcription = await transcribeAudio(audioBlob);
      
      draftMeeting.transcription_text = transcription;
      updatedMeetings = updatedMeetings.map(m => m.id === draftId ? { ...draftMeeting, title: "Gerando Inteligência..." } : m);
      setMeetings(updatedMeetings);

      // 5. INTELIGÊNCIA (Gemini)
      console.log("Gerando Insights...");
      const analysis = await generateActionPlan(transcription);
      
      // 6. BACKUP JSON (Blob)
      uploadAnalysisToBlob(analysis).catch(e => console.warn("Backup JSON falhou:", e));

      // 7. FINALIZAÇÃO (Sucesso)
      const finalMeeting: Meeting = {
        ...draftMeeting,
        title: analysis.title_sugestion || "Reunião Processada",
        status: 'completed',
        transcription_text: transcription,
        analysis_json: analysis,
        audio_url: audioUrl || undefined
      };

      updatedMeetings = updatedMeetings.map(m => m.id === draftId ? finalMeeting : m);
      setMeetings(updatedMeetings);
      saveToLocalStorage(updatedMeetings);

      // Atualiza o registro existente no banco
      await supabase.from('meetings').update({
            title: finalMeeting.title,
            status: 'completed',
            transcription_text: transcription,
            analysis_json: analysis,
            audio_url: finalMeeting.audio_url
        }).eq('id', draftId);

    } catch (error: any) {
      console.error("ERRO NO FLUXO DE IA:", error);
      
      const errorMsg = error.message || "Erro desconhecido";
      
      // Atualiza a reunião para estado de falha, mas mantém o que foi salvo (áudio/transcrição parcial)
      const failedMeeting: Meeting = {
        ...draftMeeting,
        status: 'failed',
        title: "Falha na Análise",
        transcription_text: draftMeeting.transcription_text || `Erro: ${errorMsg}`,
        analysis_json: { 
            summary: `Houve um erro técnico: ${errorMsg}. O áudio foi preservado.`, 
            priority: 'Baixa',
            sentiment: 'Neutro',
            participants_detected: [],
            main_topics: ['Erro'],
            action_plan: [],
            title_sugestion: "Erro no Processamento",
            full_transcription: draftMeeting.transcription_text || ""
        },
        audio_url: draftMeeting.audio_url 
      };

      updatedMeetings = updatedMeetings.map(m => m.id === draftId ? failedMeeting : m);
      setMeetings(updatedMeetings);
      saveToLocalStorage(updatedMeetings);
      
      // Tenta persistir o erro no banco
      supabase.from('meetings').update({ 
        status: 'failed', 
        transcription_text: failedMeeting.transcription_text 
      }).eq('id', draftId);

      alert(`Atenção: ${errorMsg}. O áudio foi salvo.`);
    } finally {
      // CRÍTICO: Garante que o indicador de carregamento pare
      console.log("Finalizando processo.");
      setIsProcessing(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if(!confirm("Excluir esta missão permanentemente?")) return;
    const filtered = meetings.filter(m => m.id !== id);
    setMeetings(filtered);
    saveToLocalStorage(filtered);
    if (selectedMeeting?.id === id) {
      setSelectedMeeting(null);
      setCurrentView(AppView.DASHBOARD);
    }
    await supabase.from('meetings').delete().eq('id', id);
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-brand-accent selection:text-white overflow-hidden">
        
        {/* Sidebar */}
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
                onClick={() => !isProcessing && setCurrentView(AppView.RECORDER)}
                icon={<Zap size={22} />}
                label="Nova Missão"
                isAction
                disabled={isProcessing}
            />
            <NavButton 
                active={currentView === AppView.SETTINGS} 
                onClick={() => setCurrentView(AppView.SETTINGS)}
                icon={<SettingsIcon size={22} />}
                label="Sistema"
            />
          </nav>

          <div className="w-full px-6 pb-4 hidden md:block">
              <div className={`p-4 rounded-xl border border-white/5 ${isOffline ? 'bg-red-900/10' : 'bg-gradient-to-br from-slate-900 to-black'}`}>
                  <p className="text-xs text-slate-500 mb-2">Status do Banco de Dados</p>
                  <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${isOffline ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                      <span className={`text-xs font-mono ${isOffline ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isOffline ? 'OFFLINE' : 'ONLINE'}
                      </span>
                  </div>
              </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8 relative min-h-screen overflow-y-auto scrollbar-hide">
          <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto pt-4 pb-20">
            {isOffline && (
              <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-yellow-200 text-sm">
                 <CloudOff size={16} />
                 <span>Modo Offline: Verifique conexão com Supabase.</span>
              </div>
            )}

            {currentView === AppView.DASHBOARD && (
              <Dashboard 
                meetings={meetings} 
                onSelectMeeting={(m) => { 
                   if (m.status !== 'processing') {
                      setSelectedMeeting(m); 
                      setCurrentView(AppView.DETAILS); 
                   } else {
                     alert("Ainda processando... aguarde a IA finalizar.");
                   }
                }}
                onDeleteMeeting={handleDeleteMeeting}
                onNewMeeting={() => !isProcessing && setCurrentView(AppView.RECORDER)}
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

            {currentView === AppView.SETTINGS && <Settings />}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

const NavButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isAction?: boolean, disabled?: boolean}> = ({active, onClick, icon, label, isAction, disabled}) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
        ${active 
            ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
            : 'hover:bg-white/5 text-slate-400 hover:text-white border border-transparent'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className={`relative ${isAction && !active ? 'text-cyan-400' : ''}`}>
         {icon}
      </div>
      <span className={`hidden md:block font-medium ${active ? 'text-white' : ''}`}>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_5px_currentColor] hidden md:block"></div>}
    </button>
);

export default App;
