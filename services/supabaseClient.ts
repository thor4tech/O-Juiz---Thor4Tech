
import { createClient } from '@supabase/supabase-js';

// CREDENCIAIS FORNECIDAS (HARDCODED PARA GARANTIA DE CONEXÃO)
const HARDCODED_URL = "https://lezfrgyzldqbxcyktpkb.supabase.co";
const HARDCODED_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlemZyZ3l6bGRxYnhjeWt0cGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5OTYyNTIsImV4cCI6MjA4MDU3MjI1Mn0.4TlZeWvsiYInkkCncKBX_Azc2TSFDR1zi_xLHsdGi8E";

// Função auxiliar para obter credenciais (Prioridade: LocalStorage -> Env Var -> Hardcoded)
const getCredentials = () => {
  let url = HARDCODED_URL;
  let key = HARDCODED_KEY;

  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('THOR_OVERRIDE_SUPABASE_URL');
    const localKey = localStorage.getItem('THOR_OVERRIDE_SUPABASE_ANON_KEY');
    if (localUrl) url = localUrl;
    if (localKey) key = localKey;
  }

  // Tenta ler do processo se disponível e não sobrescrito
  if (url === HARDCODED_URL && typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
     url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
  if (key === HARDCODED_KEY && typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
     key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  return { url, key };
};

const { url, key } = getCredentials();

export const supabase = createClient(url, key);

export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('meetings').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error("[Supabase Check] Erro:", error);
      return { success: false, message: `Erro: ${error.message || JSON.stringify(error)}` };
    }
    
    return { success: true, message: "Conectado e Operacional" };
  } catch (err: any) {
    console.error("[Supabase Check] Falha crítica:", err);
    return { success: false, message: `Falha Crítica: ${err.message}` };
  }
};
