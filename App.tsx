import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { transcribeAudio, generateActionPlan } from './services/geminiService';
import { uploadAnalysisToBlob } from './services/blobService';
import { Dashboard } from './components/Dashboard';
import { Recorder } from './components/Recorder';
import { MeetingDetails } from './components/MeetingDetails';
import { Settings } from './components/Settings';
import { Meeting, AppView } from './types';
import { Zap, LayoutGrid, Settings as SettingsIcon } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');

  const GUEST_ID = 'guest-user-demo';

  useEffect(() => {
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
      }
    } catch (e) {
      console.warn("Supabase não conectado ou erro de rede. Usando estado local.");
    }
  };

  const handleProcessMeeting = async (audioBlob: Blob, duration: number) => {
    setIsProcessing(true);
    setProcessStatus('Iniciando...');

    try {
      // Step 1: Transcribe with Gemini 2.5 Flash
      setProcessStatus('Transcrevendo áudio (Gemini 2.5 Flash)...');
      const transcription = await transcribeAudio(audioBlob);
      console.log("Transcription Complete:", transcription.substring(0, 50) + "...");

      // Step 2: Analyze with Gemini 3.0 Pro
      setProcessStatus('Gerando inteligência (Gemini 3.0 Pro)...');
      const analysis = await generateActionPlan(transcription);
      
      // Step 3: Upload JSON to Vercel Blob
      setProcessStatus('Salvando na nuvem (Vercel Blob)...');
      const blobToken = localStorage.getItem('thor4tech_blob_token');
      if (blobToken) {
         await uploadAnalysisToBlob(analysis, blobToken);
      } else {
         console.warn("Blob Token not found. Skipping cloud upload.");
      }

      // Step 4: Construct and Save Meeting Object
      const newMeeting: Meeting = {
        id: crypto.randomUUID(),
        user_id: GUEST_ID,
        title: analysis.title_sugestion || "Reunião Processada",
        transcription_text: transcription,
        analysis_json: analysis,
        duration_seconds: duration,
        status: 'completed',
        created_at: new Date().toISOString()
      };

      // Try to Save to Supabase (Best Effort)
      const { error } = await supabase.from('meetings').insert([newMeeting]);
      if (error) console.warn("Supabase insert failed, using local.", error);

      setMeetings(prev => [newMeeting, ...prev]);
      setSelectedMeeting(newMeeting);
      setCurrentView(AppView.DETAILS);

    } catch (error) {
      console.error("Falha no processamento:", error);
      alert("Erro no processo de IA. Verifique as chaves de API nas Configurações.");
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if(!confirm("Tem certeza que deseja apagar os dados desta missão?")) return;
    await supabase.from('meetings').delete().eq('id', id);
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
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

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
              {isProcessing && processStatus && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-brand-accent px-4 py-2 rounded-full text-brand-accent animate-pulse z-50">
                  {processStatus}
                </div>
              )}
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