
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Zap, AlertCircle } from 'lucide-react';

export const Auth: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  // Pre-filled with requested master credentials
  const [email, setEmail] = useState('teste@teste.com');
  const [password, setPassword] = useState('teste'); // Note: Supabase usually requires 6 chars
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Verifique seu e-mail para o link de login!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin();
      }
    } catch (error: any) {
      console.error(error);
      let msg = error.message;
      if (msg.includes('Invalid login credentials')) msg = 'Credenciais inválidas. Verifique e-mail ou senha.';
      if (msg.includes('Password should be at least')) msg = 'A senha deve ter pelo menos 6 caracteres.';
      if (msg.includes('User not found')) msg = 'Usuário não encontrado. Crie uma conta primeiro.';
      
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-accent/20 rounded-full blur-[100px] z-0"></div>

      <div className="relative z-10 w-full max-w-md p-8 glass-panel rounded-2xl border-t border-white/10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-accent/10 rounded-full mb-4 neon-border">
            <Zap size={32} className="text-brand-accent" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Thor4Tech - O Juiz</h1>
          <p className="text-slate-400 text-sm mt-2">Acesso ao Nível de Inteligência Deep Cyber</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : (isSignUp ? 'Inicializar Conta' : 'Acessar Sistema')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-slate-500 hover:text-brand-accent transition-colors"
          >
            {isSignUp ? 'Já tem uma conta? Entrar' : 'Precisa de acesso? Criar conta'}
          </button>
        </div>
      </div>
    </div>
  );
};
