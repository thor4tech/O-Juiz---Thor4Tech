
import { createClient } from '@supabase/supabase-js';

// --- ROBUST KEY LOADER ---
// Priority: 
// 1. LocalStorage (Manual Override for immediate fix)
// 2. Environment Variables (Vercel standard)
const getEffectiveKey = (key: string) => {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`THOR_OVERRIDE_${key}`);
    if (local) return local;
  }
  
  return process.env[key] || 
         process.env[`NEXT_PUBLIC_${key}`] || 
         process.env[`REACT_APP_${key}`] || 
         '';
}

const supabaseUrl = getEffectiveKey('SUPABASE_URL');
const supabaseAnonKey = getEffectiveKey('SUPABASE_ANON_KEY');

// Debug log to help identify issues in console
const isUrlValid = supabaseUrl && supabaseUrl.startsWith('http');
console.log(`[Supabase Init] URL Valid: ${isUrlValid}, Key Present: ${!!supabaseAnonKey}`);

// Use placeholder if missing to prevent crash, but operations will fail gracefully
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
