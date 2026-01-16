import { createClient } from '@supabase/supabase-js';

// In a real production build, these should be in a .env file
// e.g. import.meta.env.VITE_SUPABASE_URL
const SUPABASE_URL = 'https://yeunsorqlkweaiykwjtt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlldW5zb3JxbGt3ZWFpeWt3anR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTkyMTMsImV4cCI6MjA4NDA5NTIxM30.vcNwDzRYq6dMjOfv59AphoAhAHBfMio28lq3p6W9tkc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
