"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Lock, Mail, Key } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Registration successful! You are now logged in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background items-center justify-center font-sans text-text">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Activity className="w-6 h-6 text-emerald-500" />
          <span className="text-xl font-bold tracking-widest text-text">INTENT.TERMINAL</span>
        </div>
        
        <div className="panel p-8">
          <div className="flex items-center gap-2 text-text-muted mb-6 uppercase tracking-widest text-xs font-semibold border-b border-border pb-4">
            <Lock className="w-4 h-4" />
            {isSignUp ? 'System Registration' : 'System Authentication'}
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] text-text-muted uppercase tracking-widest mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] text-text-muted uppercase tracking-widest mb-1.5">Passkey</label>
              <div className="relative">
                <Key className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded mono-data">
                ERR: {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-surface border border-border text-xs font-semibold uppercase tracking-widest rounded py-2.5 mt-2 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : (isSignUp ? 'Register Access' : 'Initialize Session')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-text-muted hover:text-text transition-colors"
            >
              {isSignUp ? 'Return to Login' : 'Request Access (Sign Up)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
