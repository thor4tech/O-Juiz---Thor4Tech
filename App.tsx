
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { analyzeMeetingAudio } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { Recorder } from './components/Recorder';
import { MeetingDetails } from './components/MeetingDetails';
import { Settings } from './components/Settings';
import { Meeting, AppView } from './types';
import { Zap, LayoutGrid, Settings as SettingsIcon } from 'lucide-react';

const App: React.FC = () => {
  // Default directly to Dashboard, no Auth state needed
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Guest User ID for demo purposes
  const GUEST_ID = 'guest-user-demo';

  useEffect(() => {
    // Attempt to fetch meetings for guest/demo, or just start empty
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setMeetings(data as Meeting[]);
      } else if (error) {
        console.warn("Modo Offline/Demo: Não foi possível buscar do banco de dados.", error.message);
      }
    } catch (e) {
      console.warn("Supabase não conectado ou erro de rede. Usando estado local.");
    }
  };

  const handleProcessMeeting = async (audioBlob: Blob, duration: number) => {
    setIsProcessing(true);

    try {
      // 1. Analyze with Gemini (Client-side service)
      // This uses the API Key from Vercel/Environment
      const analysis = await analyzeMeetingAudio(audioBlob);

      // 2. Construct Meeting Object
      const newMeeting: Meeting = {
        id: crypto.randomUUID(), // Generate local ID
        user_id: GUEST_ID,
        title: analysis.title_sugestion || "Reunião Processada",
        transcription_text: analysis.full_transcription,
        analysis_json: analysis,
        duration_seconds: duration,
        status: 'completed',
        created_at: new Date().toISOString()
      };

      // 3. Try to Save to Supabase (Best Effort)
      const { error } = await supabase
        .from('meetings')
        .insert([newMeeting]);

      if (error) {
        console.warn("Salvamento no banco falhou (provavelmente permissão/RLS). Salvando localmente para visualização.", error);
      }

      // 4. Always update local state so the user sees the result immediately
      setMeetings(prev => [newMeeting, ...prev]);
      setSelectedMeeting(newMeeting);
      setCurrentView(AppView.DETAILS);

    } catch (error) {
      console.error("Falha no processamento:", error);
      alert("Análise falhou. Verifique se sua API Key do Gemini está configurada corretamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if(!confirm("Tem certeza que deseja apagar os dados desta missão?")) return;
    
    // Try to delete from DB
    await supabase.from('meetings').delete().eq('id', id);
    
    // Update local state
    setMeetings(prev => prev.filter(m => m.id !== id));
    
    if (selectedMeeting?.id === id) {
      setSelectedMeeting(null);
      setCurrentView(AppView.DASHBOARD);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-brand-accent selection:text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-20 md:w-64 glass-panel border-r border-white/10 z-50 flex flex-col items-center md:items-start py-8 transition-all">
        <div className="mb-12 px-0 md:px-8 flex items-center gap-3">
          <Zap className="text-brand-accent shrink-0" size={32} fill="currentColor" />
          <span className="text-xl font-bold tracking-tighter hidden md:block text-white">THOR4TECH</span>
        </div>

        <nav className="flex-1 w-full space-y-2 px-2 md:px-4">
          <button 
            onClick={() => setCurrentView(AppView.DASHBOARD)}
            className={`w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3 rounded-lg transition-all ${currentView === AppView.DASHBOARD ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
          >
            <LayoutGrid size={24} />
            <span className="hidden md:block font-medium">Painel</span>
          </button>
          
          <button 
             onClick={() => setCurrentView(AppView.RECORDER)}
             className={`w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3 rounded-lg transition-all ${currentView === AppView.RECORDER ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
          >
             <div className="relative">
                <div className={`absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ${currentView === AppView.RECORDER ? 'animate-ping' : ''}`}></div>
                <Zap size={24} />
             </div>
             <span className="hidden md:block font-medium">Nova Missão</span>
          </button>

          <button 
            onClick={() => setCurrentView(AppView.SETTINGS)}
            className={`w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3 rounded-lg transition-all ${currentView === AppView.SETTINGS ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
          >
            <SettingsIcon size={24} />
            <span className="hidden md:block font-medium">Configurações</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 md:ml-64 p-8 relative min-h-screen">
        {/* Background Ambience */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Dynamic Views */}
        <div className="relative z-10">
          {currentView === AppView.DASHBOARD && (
            <Dashboard 
              meetings={meetings} 
              onSelectMeeting={(m) => { setSelectedMeeting(m); setCurrentView(AppView.DETAILS); }}
              onDeleteMeeting={handleDeleteMeeting}
              onNewMeeting={() => setCurrentView(AppView.RECORDER)}
            />
          )}

          {currentView === AppView.RECORDER && (
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
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
  );
};

export default App;
