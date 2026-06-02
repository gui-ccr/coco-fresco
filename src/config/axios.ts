import axios from 'axios';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const IS_CONFIGURED = Boolean(url) && Boolean(key);

export const api = axios.create({
  baseURL: `${url ?? 'https://placeholder.supabase.co'}/rest/v1`,
  headers: {
    apikey:        key ?? 'placeholder',
    Authorization: `Bearer ${key ?? 'placeholder'}`,
    'Content-Type': 'application/json',
    Prefer:        'return=representation',
  },
});
