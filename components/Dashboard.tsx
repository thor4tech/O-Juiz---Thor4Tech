
import React, { useState, useMemo } from 'react';
import { Meeting } from '../types';
import { 
  Calendar, Clock, ArrowRight, Trash2, Search, Zap, 
  LayoutGrid, List, Filter, TrendingUp, CheckCircle, AlertTriangle, Loader2 
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface DashboardProps {
  meetings: Meeting[];
  onSelectMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (id: string) => void;
  onNewMeeting: () => void;
}

type ViewMode = 'grid' | 'list';
type PriorityFilter = 'all' | 'Alta' | 'Urgente' | 'Média' | 'Baixa';

export const Dashboard: React.FC<DashboardProps> = ({ meetings, onSelectMeeting, onDeleteMeeting, onNewMeeting }) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  // Stats Calculation
  const stats = useMemo(() => {
    const totalMeetings = meetings.length;
    const completedMeetings = meetings.filter(m => m.status === 'completed');
    const totalDurationSeconds = completedMeetings.reduce((acc, curr) => acc + curr.duration_seconds, 0);
    const hoursSaved = Math.max(0, (totalDurationSeconds * 2) / 60); 
    const urgentCount = completedMeetings.filter(m => m.analysis_json?.priority === 'Urgente').length;
    
    return {
      total: totalMeetings,
      hoursSaved: Math.floor(hoursSaved),
      urgent: urgentCount
    };
  }, [meetings]);

  // Filtering Logic
  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      // Safe check for missing analysis_json during processing
      const summary = m.analysis_json?.summary || '';
      const priority = m.analysis_json?.priority || 'Baixa';

      const matchesSearch = 
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        summary.toLowerCase().includes(search.toLowerCase());
      
      const matchesPriority = priorityFilter === 'all' || priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [meetings, search, priorityFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Alta': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'Média': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  return (
    <ErrorBoundary>
    <div className="w-full max-w-7xl mx-auto animate-fade-in">
      
      {/* HUD / Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 opacity-10"><Zap size={100} /></div>
           <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Missões Totais</p>
              <h2 className="text-4xl font-bold text-white mt-1">{stats.total}</h2>
           </div>
           <div className="p-3 bg-brand-accent/20 rounded-full text-brand-accent">
             <TrendingUp size={24} />
           </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 opacity-10"><Clock size={100} /></div>
           <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Tempo Economizado</p>
              <h2 className="text-4xl font-bold text-white mt-1">{stats.hoursSaved} <span className="text-lg text-slate-500">min</span></h2>
           </div>
           <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400">
             <CheckCircle size={24} />
           </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 opacity-10"><AlertTriangle size={100} /></div>
           <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Alta Prioridade</p>
              <h2 className="text-4xl font-bold text-white mt-1">{stats.urgent}</h2>
           </div>
           <div className="p-3 bg-red-500/20 rounded-full text-red-400">
             <AlertTriangle size={24} />
           </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Painel de Missões</h1>
          <p className="text-slate-400">Gerenciamento tático de inteligência.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 bg-slate-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-brand-accent text-sm"
                />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-white/10">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                   onClick={() => setViewMode('list')}
                   className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <List size={18} />
                </button>
            </div>

            <button 
              onClick={onNewMeeting}
              className="bg-brand-accent hover:bg-brand-accentHover text-white px-5 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <Zap size={18} />
              Nova Missão
            </button>
        </div>
      </div>

      {filteredMeetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
           <div className="p-4 bg-slate-900 rounded-full mb-4 border border-white/5">
             <Zap size={48} className="text-slate-600" />
           </div>
          <p className="text-xl text-slate-300 font-medium">Nenhuma missão encontrada</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredMeetings.map((meeting) => (
            <div 
              key={meeting.id}
              className={`group glass-panel rounded-xl p-6 hover:border-brand-accent/50 transition-all cursor-pointer relative overflow-hidden ${viewMode === 'list' ? 'flex items-center justify-between' : ''}`}
              onClick={() => onSelectMeeting(meeting)}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={viewMode === 'list' ? "flex-1" : ""}>
                <div className="flex justify-between items-start mb-4">
                  {meeting.status === 'processing' ? (
                     <span className="px-2 py-1 rounded text-xs border bg-slate-800 text-cyan-400 border-cyan-500/30 flex items-center gap-2">
                       <Loader2 size={12} className="animate-spin" /> Processando...
                     </span>
                  ) : (
                    <span className={`px-2 py-1 rounded text-xs border font-medium ${getPriorityColor(meeting.analysis_json?.priority || 'Baixa')}`}>
                      {meeting.analysis_json?.priority || 'Baixa'}
                    </span>
                  )}
                  
                  {viewMode === 'grid' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteMeeting(meeting.id); }}
                      className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{meeting.title}</h3>
                
                {viewMode === 'grid' && (
                  <p className="text-slate-400 text-sm line-clamp-3 mb-6 leading-relaxed">
                    {meeting.status === 'processing' ? 'A inteligência artificial está analisando este áudio...' : meeting.analysis_json?.summary}
                  </p>
                )}

                <div className="flex items-center gap-3 text-slate-500 text-xs">
                  <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(meeting.created_at).toLocaleDateString('pt-BR')}</span>
                  <span className="flex items-center gap-1"><Clock size={12}/> {Math.floor(meeting.duration_seconds / 60)}m</span>
                </div>
              </div>

               {viewMode === 'list' && (
                  <div className="flex items-center gap-4">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteMeeting(meeting.id); }}
                        className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               )}
            </div>
          ))}
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
};
