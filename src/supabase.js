import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ccunqfmjzwfcavhbphgj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdW5xZm1qendmY2F2aGJwaGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjMzMDksImV4cCI6MjA4NjE5OTMwOX0.jnUgnA6hrcDWHcwRehjH0-KQN5z7s78_A9fDhlPuCZc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
