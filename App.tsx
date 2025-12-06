
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { transcribeAudio, generateActionPlan } from './services/geminiService';
import { uploadAnalysisToBlob } from './services/blobService';
import { Dashboard } from './components/Dashboard';
import { Recorder } from './components/Recorder';
import { MeetingDetails } from './components/MeetingDetails';
import { Settings } from './components/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Meeting, AppView } from './types';
import { Zap, LayoutGrid, Settings as SettingsIcon, CloudOff, Cloud } from 'lucide-react';

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

  // --- STORAGE LOGIC ---
  const saveToLocalStorage = (newMeetings: Meeting[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newMeetings));
  };

  const loadMeetings = async () => {
    // 1. Load Local Backup First (Instant UI)
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    let localMeetings: Meeting[] = [];
    if (localData) {
      try {
        localMeetings = JSON.parse(localData);
        setMeetings(localMeetings);
      } catch (e) {
        console.error("Error parsing local meetings", e);
      }
    }

    // 2. Try Supabase Sync
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setMeetings(data as Meeting[]);
        saveToLocalStorage(data as Meeting[]); // Update local backup with cloud truth
        setIsOffline(false);
      }
    } catch (e) {
      console.warn("⚠️ Mode Offline Active: Could not sync with Supabase.", e);
      setIsOffline(true);
      // Keep using localMeetings loaded in step 1
    }
  };

  const handleProcessMeeting = async (audioBlob: Blob, duration: number) => {
    // 1. DRAFT CREATION (Immediate UI Update)
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

    // Optimistic Update
    const updatedMeetings = [draftMeeting, ...meetings];
    setMeetings(updatedMeetings);
    saveToLocalStorage(updatedMeetings); // Backup immediately
    
    setIsProcessing(true);
    setCurrentView(AppView.DASHBOARD);

    try {
      // 2. ATTEMPT CLOUD SAVE (Non-blocking)
      supabase.from('meetings').insert([draftMeeting]).then(({ error }) => {
        if (error) console.warn("Cloud save failed, relying on local storage.");
      });

      // 3. TRANSCRIPTION (Flash)
      const transcription = await transcribeAudio(audioBlob);
      
      // Update local state partially
      draftMeeting.transcription_text = transcription;
      draftMeeting.title = "Analisando inteligência...";
      
      const meetingsWithTrans = meetings.map(m => m.id === draftId ? { ...draftMeeting } : m);
      setMeetings(meetingsWithTrans);
      saveToLocalStorage(meetingsWithTrans);

      // 4. INTELLIGENCE (Pro)
      const analysis = await generateActionPlan(transcription);
      
      // 5. BLOB BACKUP
      uploadAnalysisToBlob(analysis).catch(console.warn);

      // 6. FINALIZE
      const finalMeeting: Meeting = {
        ...draftMeeting,
        title: analysis.title_sugestion || "Reunião Finalizada",
        status: 'completed',
        transcription_text: transcription,
        analysis_json: analysis
      };

      // Update State & Local Storage
      const finalMeetings = meetings.map(m => m.id === draftId ? finalMeeting : m);
      setMeetings(finalMeetings);
      saveToLocalStorage(finalMeetings);

      // Update Supabase
      await supabase
        .from('meetings')
        .update({
            title: finalMeeting.title,
            status: 'completed',
            transcription_text: transcription,
            analysis_json: analysis
        })
        .eq('id', draftId);

    } catch (error: any) {
      console.error("PROCESSING ERROR:", error);
      
      // Handle Failure Gracefully
      const failedMeeting: Meeting = {
        ...draftMeeting,
        status: 'failed',
        title: "Erro no Processamento (Backup Salvo)",
        transcription_text: "Erro: " + (error.message || "Falha desconhecida")
      };

      const failedMeetingsList = meetings.map(m => m.id === draftId ? failedMeeting : m);
      setMeetings(failedMeetingsList);
      saveToLocalStorage(failedMeetingsList);
      
      // Try to update DB status if possible
      supabase.from('meetings').update({ status: 'failed' }).eq('id', draftId);

      alert(`Houve uma falha na IA: ${error.message}. O rascunho foi salvo localmente.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if(!confirm("Tem certeza? Esta ação é irreversível.")) return;
    
    // Remove locally
    const filtered = meetings.filter(m => m.id !== id);
    setMeetings(filtered);
    saveToLocalStorage(filtered);

    if (selectedMeeting?.id === id) {
      setSelectedMeeting(null);
      setCurrentView(AppView.DASHBOARD);
    }

    // Try remove from cloud
    supabase.from('meetings').delete().eq('id', id).then(({error}) => {
       if(error) console.warn("Could not delete from cloud (offline?)");
    });
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
              <div className={`p-4 rounded-xl border border-white/5 ${isOffline ? 'bg-red-900/10' : 'bg-gradient-to-br from-slate-900 to-black'}`}>
                  <p className="text-xs text-slate-500 mb-2">Status do Banco de Dados</p>
                  <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${isOffline ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                      <span className={`text-xs font-mono ${isOffline ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isOffline ? 'OFFLINE (Local)' : 'ONLINE (Cloud)'}
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
                 <span>Modo Offline Ativo: As gravações estão sendo salvas apenas neste dispositivo. Verifique as chaves do Supabase.</span>
              </div>
            )}

            {currentView === AppView.DASHBOARD && (
              <Dashboard 
                meetings={meetings} 
                onSelectMeeting={(m) => { 
                   if (m.status === 'completed' || m.status === 'failed') {
                      setSelectedMeeting(m); 
                      setCurrentView(AppView.DETAILS); 
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

            {currentView === AppView.SETTINGS && <Settings />}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

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
         {icon}
      </div>
      <span className={`hidden md:block font-medium ${active ? 'text-white' : ''}`}>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_5px_currentColor] hidden md:block"></div>}
    </button>
);

export default App;
