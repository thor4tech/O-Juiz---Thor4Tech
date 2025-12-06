
import React, { useState } from 'react';
import { Meeting } from '../types';
import { Calendar, Clock, ArrowRight, Trash2, Search, Zap } from 'lucide-react';

interface DashboardProps {
  meetings: Meeting[];
  onSelectMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (id: string) => void;
  onNewMeeting: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ meetings, onSelectMeeting, onDeleteMeeting, onNewMeeting }) => {
  const [search, setSearch] = useState('');

  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.analysis_json.summary.toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Alta': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'Média': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Painel de Missões</h1>
          <p className="text-slate-400">Visão geral da sua inteligência estratégica.</p>
        </div>
        <button 
          onClick={onNewMeeting}
          className="bg-brand-accent hover:bg-brand-accentHover text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
        >
          <Zap size={20} />
          Nova Reunião
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar missões..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-accent transition-colors"
        />
      </div>

      {filteredMeetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
           <div className="p-4 bg-slate-900 rounded-full mb-4 border border-white/5">
             <Zap size={48} className="text-slate-600" />
           </div>
          <p className="text-xl text-slate-300 font-medium">Nenhuma missão registrada</p>
          <p className="text-slate-500 mt-2 max-w-md">O sistema está pronto. Inicie uma nova gravação para gerar inteligência estratégica.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeetings.map((meeting) => (
            <div 
              key={meeting.id}
              className="group glass-panel rounded-xl p-6 hover:border-brand-accent/50 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => onSelectMeeting(meeting)}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-xs border ${getPriorityColor(meeting.analysis_json.priority)}`}>
                  {meeting.analysis_json.priority}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteMeeting(meeting.id); }}
                  className="text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{meeting.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-3 mb-6">
                {meeting.analysis_json.summary}
              </p>

              <div className="flex items-center justify-between text-slate-500 text-xs mt-auto">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(meeting.created_at).toLocaleDateString('pt-BR')}</span>
                  <span className="flex items-center gap-1"><Clock size={12}/> {Math.floor(meeting.duration_seconds / 60)}m</span>
                </div>
                <ArrowRight size={16} className="text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
