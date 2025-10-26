// Runtime-safe Supabase client with fallbacks
// Prefer environment variables injected by the build; fall back to known public values
// NOTE: This file is used via Vite alias to avoid modifying the auto-generated client.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const env = (import.meta as any)?.env ?? {};

const SUPABASE_URL: string =
  env.VITE_SUPABASE_URL ||
  (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_SUPABASE_URL) ||
  'https://tkrcdxkdfjeupbdlbcfz.supabase.co';

const SUPABASE_PUBLISHABLE_KEY: string =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcmNkeGtkZmpldXBiZGxiY2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDkyNTIsImV4cCI6MjA3NTMyNTI1Mn0.PVrTzBkP1sDtxgfWyYNboJTLsJFg-qT5tfCQNZS8sO8';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
