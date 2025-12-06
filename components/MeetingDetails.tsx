import React, { useState } from 'react';
import { Meeting } from '../types';
import { ArrowLeft, CheckCircle2, User, Activity, FileText, Code } from 'lucide-react';

interface MeetingDetailsProps {
  meeting: Meeting;
  onBack: () => void;
}

export const MeetingDetails: React.FC<MeetingDetailsProps> = ({ meeting, onBack }) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'transcription' | 'json'>('insights');
  const { analysis_json } = meeting;

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-brand-accent mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="glass-panel p-8 rounded-2xl mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{meeting.title}</h1>
            <div className="flex gap-3 text-sm text-slate-400">
               <span>{new Date(meeting.created_at).toLocaleString()}</span>
               <span>•</span>
               <span>{Math.floor(meeting.duration_seconds / 60)} min {meeting.duration_seconds % 60} sec</span>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded border text-sm bg-slate-900 border-slate-700 text-slate-300`}>
               Sentiment: {analysis_json.sentiment}
            </span>
            <span className={`px-3 py-1 rounded border text-sm font-semibold
               ${analysis_json.priority === 'Urgente' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 
                 analysis_json.priority === 'Alta' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 
                 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'}`}>
               {analysis_json.priority} Priority
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          <button 
            onClick={() => setActiveTab('insights')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'insights' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <div className="flex items-center gap-2"><Activity size={18} /> Strategic Insights</div>
          </button>
          <button 
            onClick={() => setActiveTab('transcription')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'transcription' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <div className="flex items-center gap-2"><FileText size={18} /> Full Transcription</div>
          </button>
          <button 
            onClick={() => setActiveTab('json')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'json' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
             <div className="flex items-center gap-2"><Code size={18} /> Raw Data</div>
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {activeTab === 'insights' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-semibold text-brand-accent mb-3">Executive Summary</h3>
                <p className="text-slate-300 leading-relaxed text-lg">{analysis_json.summary}</p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                  <h3 className="text-lg font-semibold text-brand-accent mb-3">Action Plan</h3>
                  <div className="space-y-3">
                    {analysis_json.action_plan.map((item, idx) => (
                      <div key={idx} className="flex gap-3 bg-slate-900/50 p-4 rounded-lg border border-white/5">
                        <CheckCircle2 className="text-brand-accent shrink-0 mt-1" size={20} />
                        <div>
                          <p className="text-slate-200 font-medium">{item.task}</p>
                          <div className="flex gap-3 text-xs text-slate-500 mt-1">
                            <span>Owner: {item.owner}</span>
                            <span>Due: {item.deadline}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="space-y-8">
                   <section>
                    <h3 className="text-lg font-semibold text-brand-accent mb-3">Main Topics</h3>
                    <div className="flex flex-wrap gap-2">
                        {analysis_json.main_topics.map((topic, i) => (
                        <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-slate-300 text-sm border border-white/10">
                            {topic}
                        </span>
                        ))}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-lg font-semibold text-brand-accent mb-3">Participants</h3>
                    <div className="space-y-2">
                        {analysis_json.participants_detected.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-400">
                            <User size={16} /> {p}
                        </div>
                        ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transcription' && (
            <div className="bg-slate-950 p-6 rounded-lg border border-white/5 font-serif text-slate-300 leading-relaxed whitespace-pre-wrap">
              {analysis_json.full_transcription || meeting.transcription_text}
            </div>
          )}

          {activeTab === 'json' && (
            <pre className="bg-slate-950 p-6 rounded-lg border border-white/5 text-xs text-green-400 overflow-x-auto">
              {JSON.stringify(analysis_json, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};