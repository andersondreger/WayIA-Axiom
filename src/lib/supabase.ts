import { createClient } from '@supabase/supabase-js';

// Use environment variables or fallback to the keys provided by the user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xzlotpwqpdjwzqerdyfb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bG90cHdxcGRqd3pxZXJkeWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMTcwMjEsImV4cCI6MjA4Nzg5MzAyMX0.a17_2kF4vBSRI84W7R-tAUl-D-ZXEey6BwEi3d2aMuU';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
