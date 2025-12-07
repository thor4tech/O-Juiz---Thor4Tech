
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface ActionPlanItem {
  task: string;
  owner: string;
  deadline: string;
}

export interface MeetingAnalysis {
  title_sugestion: string;
  summary: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  sentiment: 'Positivo' | 'Neutro' | 'Negativo' | 'Preocupado' | 'Empolgado';
  participants_detected: string[];
  main_topics: string[];
  action_plan: ActionPlanItem[];
  full_transcription: string;
}

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  transcription_text?: string;
  analysis_json?: MeetingAnalysis; // Optional while processing
  audio_url?: string; // New field for audio persistence
  duration_seconds: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  RECORDER = 'RECORDER',
  DETAILS = 'DETAILS',
  SETTINGS = 'SETTINGS'
}
