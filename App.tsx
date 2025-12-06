import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase, getSession } from './services/supabaseClient';
import { analyzeMeetingAudio } from './services/geminiService';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Recorder } from './components/Recorder';
import { MeetingDetails } from './components/MeetingDetails';
import { Meeting, AppView, MeetingAnalysis } from './types';
import { Zap, LayoutGrid, Settings, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUTH);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check active session
    getSession().then(({ session }) => {
      if (session) {
        setSession(session);
        setCurrentView(AppView.DASHBOARD);
        fetchMeetings(session.user.id);
      } else {
        setCurrentView(AppView.AUTH);
      }
    });

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setCurrentView(AppView.DASHBOARD);
        fetchMeetings(session.user.id);
      } else {
        setCurrentView(AppView.AUTH);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMeetings = async (userId: string) => {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) setMeetings(data as Meeting[]);
    if (error) console.error("Erro ao buscar reuniões:", error);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView(AppView.AUTH);
  };

  const handleProcessMeeting = async (audioBlob: Blob, duration: number) => {
    if (!session) return;
    setIsProcessing(true);

    try {
      // 1. Analyze with Gemini (Client-side service)
      const analysis = await analyzeMeetingAudio(audioBlob);

      // 2. Save to Supabase
      const newMeeting: Partial<Meeting> = {
        user_id: session.user.id,
        title: analysis.title_sugestion || "Reunião Sem Título",
        transcription_text: analysis.full_transcription,
        analysis_json: analysis,
        duration_seconds: duration,
        status: 'completed'
      };

      const { data, error } = await supabase
        .from('meetings')
        .insert([newMeeting])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMeetings(prev => [data as Meeting, ...prev]);
        setSelectedMeeting(data as Meeting);
        setCurrentView(AppView.DETAILS);
      }

    } catch (error) {
      console.error("Falha no processamento:", error);
      alert("Análise falhou. Por favor tente novamente. Verifique sua chave API.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if(!confirm("Tem certeza que deseja apagar os dados desta missão?")) return;
    
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (!error) {
      setMeetings(prev => prev.filter(m => m.id !== id));
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(null);
        setCurrentView(AppView.DASHBOARD);
      }
    }
  };

  // Rendering logic
  if (currentView === AppView.AUTH) {
    return <Auth onLogin={() => setCurrentView(AppView.DASHBOARD)} />;
  }

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

          <button className="w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <Settings size={24} />
            <span className="hidden md:block font-medium">Configurações</span>
          </button>
        </nav>

        <div className="w-full px-2 md:px-4 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut size={24} />
            <span className="hidden md:block font-medium">Desconectar</span>
          </button>
        </div>
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
        </div>
      </main>
    </div>
  );
};

export default App;