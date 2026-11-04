import { createClient } from '@supabase/supabase-js';

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : null;
const procEnv = typeof process !== 'undefined' && process.env ? process.env : null;

export const supabaseUrl = (
  metaEnv?.VITE_SUPABASE_URL ||
  procEnv?.VITE_SUPABASE_URL ||
  procEnv?.SUPABASE_URL ||
  'https://berjxxsglkwtciiltvri.supabase.co'
) as string;

export const supabaseAnonKey = (
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  procEnv?.VITE_SUPABASE_ANON_KEY ||
  procEnv?.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlcmp4eHNnbGt3dGNpaWx0dnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2ODEwOTQsImV4cCI6MjEwOTI1NzA5NH0.L3DF85lkE3ec-A3D1fPt4QsFXj6r3Xxmrw1awUq2xeE'
) as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
