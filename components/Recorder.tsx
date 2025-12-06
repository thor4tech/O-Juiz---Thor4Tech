
import React, { useState, useRef, useEffect } from 'react';
import { AudioVisualizer } from './Visualizer';
import { Mic, Square, Save, Loader2, Pause, Play, RefreshCw } from 'lucide-react';

interface RecorderProps {
  onProcess: (blob: Blob, duration: number) => Promise<void>;
  isProcessing: boolean;
}

export const Recorder: React.FC<RecorderProps> = ({ onProcess, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // UX: Prevent accidental tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRecording || isProcessing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRecording, isProcessing]);

  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Cleanup stream tracks
        audioStream.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsRecording(false);
        setIsPaused(false);
        stopTimer();
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();

    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Permissão de microfone negada. Verifique as configurações do navegador.");
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      // RESUME
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    } else {
      // PAUSE
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // Timer stop is handled in onstop
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleProcess = () => {
    if (audioBlob) {
      onProcess(audioBlob, duration);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetRecorder = () => {
    setAudioBlob(null);
    setDuration(0);
    setStream(null);
    setIsPaused(false);
    setIsRecording(false);
    chunksRef.current = [];
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-8 glass-panel rounded-2xl neon-border min-h-[450px] transition-all duration-500">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
          Gravador Tático
        </h2>
        <p className="text-slate-400 text-sm tracking-wide">
          {isRecording 
            ? (isPaused ? "Sessão Pausada" : "Capturando Áudio...") 
            : (audioBlob ? "Áudio Capturado" : "Pronto para iniciar a missão")}
        </p>
      </div>

      {/* Visualizer Area */}
      <div className="w-full mb-8 relative h-32 flex items-center justify-center">
        {isRecording && !isPaused ? (
          <AudioVisualizer stream={stream} isRecording={isRecording} />
        ) : (
          <div className={`w-full h-full rounded-xl flex items-center justify-center border transition-all duration-300 ${audioBlob ? 'bg-cyan-900/10 border-cyan-500/30' : 'bg-slate-900/50 border-white/5'}`}>
             {audioBlob ? 
                <div className="flex flex-col items-center gap-2 animate-fade-in">
                    <Save size={32} className="text-cyan-400"/> 
                    <span className="text-cyan-400 font-mono text-sm">Áudio Pronto para Análise</span>
                </div> : 
                (isPaused ? 
                    <div className="flex flex-col items-center gap-2 animate-pulse">
                        <Pause size={32} className="text-yellow-500"/>
                        <span className="text-yellow-500 font-mono text-sm">SISTEMA PAUSADO</span>
                    </div> : 
                    <div className="flex flex-col items-center gap-2 opacity-50">
                        <Mic size={32} className="text-slate-500"/>
                        <span className="text-slate-600 text-sm">Aguardando comando...</span>
                    </div>
                )
             }
          </div>
        )}
      </div>

      {/* Timer */}
      <div className={`text-6xl font-mono mb-10 tabular-nums tracking-wider transition-colors ${isPaused ? 'text-yellow-500 opacity-80' : 'text-white'}`}>
        {formatTime(duration)}
      </div>

      {/* Controls */}
      <div className="flex gap-6 items-center">
        {!isRecording && !audioBlob && !isProcessing && (
          <button 
            onClick={startRecording}
            className="group relative flex items-center justify-center w-20 h-20 bg-red-600 hover:bg-red-500 rounded-full transition-all shadow-lg shadow-red-600/20 hover:scale-110"
          >
            <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20 group-hover:opacity-40"></div>
            <Mic size={32} className="text-white" />
          </button>
        )}

        {isRecording && (
          <>
            <button 
              onClick={togglePause}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isPaused ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
              title={isPaused ? "Retomar" : "Pausar"}
            >
              {isPaused ? <Play size={28} fill="currentColor"/> : <Pause size={28} fill="currentColor"/>}
            </button>
            <button 
              onClick={stopRecording}
              className="w-20 h-20 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
            >
              <Square size={28} fill="currentColor" />
            </button>
          </>
        )}

        {audioBlob && !isProcessing && (
          <div className="flex gap-4 animate-fade-in">
            <button 
                onClick={resetRecorder}
                className="px-6 py-4 rounded-full border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
                <RefreshCw size={18}/> Descartar
            </button>
            <button 
                onClick={handleProcess}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-full transition-all shadow-lg shadow-cyan-600/30 hover:scale-105 font-bold tracking-wide"
            >
                <Save size={20} />
                GERAR INTELIGÊNCIA
            </button>
          </div>
        )}

        {isProcessing && (
           <div className="flex flex-col items-center gap-3 animate-fade-in">
             <div className="flex items-center gap-3 px-8 py-4 bg-slate-900/80 text-cyan-400 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
               <Loader2 className="animate-spin" size={24} />
               <span className="font-medium animate-pulse">Processando na Nuvem...</span>
             </div>
             <p className="text-xs text-slate-500">Você pode navegar enquanto processa.</p>
           </div>
        )}
      </div>
    </div>
  );
};
