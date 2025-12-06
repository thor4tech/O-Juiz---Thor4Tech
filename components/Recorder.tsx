import React, { useState, useRef, useEffect } from 'react';
import { AudioVisualizer } from './Visualizer';
import { Mic, Square, Save, Loader2, AlertCircle } from 'lucide-react';

interface RecorderProps {
  onProcess: (blob: Blob, duration: number) => Promise<void>;
  isProcessing: boolean;
}

export const Recorder: React.FC<RecorderProps> = ({ onProcess, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

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
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Timer
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
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

  const reset = () => {
    setAudioBlob(null);
    setDuration(0);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-8 glass-panel rounded-2xl neon-border min-h-[400px]">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
          Meeting Recorder
        </h2>
        <p className="text-slate-400">Capture audio for AI Analysis</p>
      </div>

      <div className="w-full mb-8">
        {isRecording ? (
          <AudioVisualizer stream={stream} isRecording={isRecording} />
        ) : (
          <div className="h-24 w-full flex items-center justify-center border border-white/10 rounded-lg bg-slate-900/50">
             {audioBlob ? <span className="text-cyan-400 font-mono">Audio Captured Ready to Process</span> : <span className="text-slate-600">Waiting for input...</span>}
          </div>
        )}
      </div>

      <div className="text-5xl font-mono text-white mb-8 tabular-nums tracking-wider">
        {formatTime(duration)}
      </div>

      <div className="flex gap-4">
        {!isRecording && !audioBlob && (
          <button 
            onClick={startRecording}
            className="flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg shadow-red-500/20"
          >
            <Mic size={24} />
            <span className="font-semibold">Start Recording</span>
          </button>
        )}

        {isRecording && (
          <button 
            onClick={stopRecording}
            className="flex items-center gap-2 px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-full transition-all"
          >
            <Square size={24} fill="currentColor" />
            <span className="font-semibold">Stop</span>
          </button>
        )}

        {audioBlob && !isProcessing && (
          <>
            <button 
                onClick={reset}
                className="px-6 py-4 text-slate-400 hover:text-white transition-colors"
            >
                Discard
            </button>
            <button 
                onClick={handleProcess}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-full transition-all shadow-lg shadow-cyan-500/20"
            >
                <Save size={24} />
                <span className="font-semibold">Process with Brain</span>
            </button>
          </>
        )}

        {isProcessing && (
           <div className="flex items-center gap-3 px-8 py-4 bg-slate-800 text-cyan-400 rounded-full">
             <Loader2 className="animate-spin" />
             <span>Transcribing & Analyzing...</span>
           </div>
        )}
      </div>

      {duration > 3600 && (
         <div className="mt-4 flex items-center gap-2 text-yellow-500">
            <AlertCircle size={16} />
            <span className="text-sm">Meeting exceeded 60 minutes. Analysis might be summarized.</span>
         </div>
      )}
    </div>
  );
};