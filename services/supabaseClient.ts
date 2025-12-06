
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
