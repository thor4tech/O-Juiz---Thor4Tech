
import { createClient } from '@supabase/supabase-js';

// --- ROBUST KEY LOADER ---
// Priority 1: Manual Override (LocalStorage) - GUARANTEES connection if user pastes valid keys
// Priority 2: Vercel Env Vars (NEXT_PUBLIC_)
const getEffectiveKey = (key: string) => {
  if (typeof window !== 'undefined') {
    // Check Manual Override first
    const local = localStorage.getItem(`THOR_OVERRIDE_${key}`);
    if (local && local.length > 5) return local;
  }
  
  // Check standard Vercel vars
  return process.env[key] || 
         process.env[`NEXT_PUBLIC_${key}`] || 
         process.env[`REACT_APP_${key}`] || 
         '';
}

const supabaseUrl = getEffectiveKey('SUPABASE_URL');
const supabaseAnonKey = getEffectiveKey('SUPABASE_ANON_KEY');

const isUrlValid = supabaseUrl && supabaseUrl.startsWith('http');
if (!isUrlValid) {
    console.warn("[Supabase] URL inválida ou não encontrada. O App usará modo OFFLINE (LocalStorage).");
} else {
    console.log("[Supabase] Cliente inicializado com sucesso.");
}

// Fallback to prevent crash, requests will fail gracefully and App.tsx will handle Offline Mode
const finalUrl = isUrlValid ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'thor4tech' } 
  }
});

// Funcao de Diagnostico Detalhado
export const checkSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!isUrlValid) return { success: false, message: "URL do Supabase não configurada." };

  try {
    // Tenta uma query leve para validar autenticação e existência da tabela
    const { error } = await supabase.from('meetings').select('count', { count: 'exact', head: true });

    if (error) {
      // Detalhamento de Erros Comuns
      if (error.code === 'PGRST301') return { success: false, message: "JWT/Key Expirada ou Inválida." };
      if (error.code === '42P01') return { success: false, message: "Tabela 'meetings' não existe no banco." };
      if (error.message.includes("FetchError")) return { success: false, message: "Erro de Rede (CORS ou Offline)." };
      if (error.code === '23505') return { success: false, message: "Conflito de chave única." };
      
      return { success: false, message: `Erro API: ${error.message} (Código: ${error.code})` };
    }

    return { success: true, message: "Conexão Ativa e Sincronizada." };
  } catch (e: any) {
    return { success: false, message: `Erro Crítico: ${e.message}` };
  }
};
