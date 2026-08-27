import { createClient } from '@supabase/supabase-js';
import { db } from './db';

let lastUrl = '';
let lastKey = '';
let supabaseClient = null;

export function getSupabase() {
  const settings = db.getSettings();
  const url = settings.supabase_url ? settings.supabase_url.trim() : '';
  const key = settings.supabase_key ? settings.supabase_key.trim() : '';

  if (!url || !key) return null;

  if (supabaseClient && lastUrl === url && lastKey === key) {
    return supabaseClient;
  }

  try {
    supabaseClient = createClient(url, key);
    lastUrl = url;
    lastKey = key;
    return supabaseClient;
  } catch (e) {
    console.error('Supabase Init Error:', e);
    return null;
  }
}

export async function pushToCloud() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase Config Missing! Please enter URL & Anon Key in Settings.');

  const backupData = db.exportJSON();

  if (backupData.members && backupData.members.length > 0) {
    const { error } = await client.from('members').upsert(backupData.members);
    if (error) console.warn('Supabase members sync warning:', error);
  }
  if (backupData.vargani && backupData.vargani.length > 0) {
    const { error } = await client.from('vargani').upsert(backupData.vargani);
    if (error) console.warn('Supabase vargani sync warning:', error);
  }
  if (backupData.jama && backupData.jama.length > 0) {
    const { error } = await client.from('jama').upsert(backupData.jama);
    if (error) console.warn('Supabase jama sync warning:', error);
  }
  if (backupData.kharch && backupData.kharch.length > 0) {
    const { error } = await client.from('kharch').upsert(backupData.kharch);
    if (error) console.warn('Supabase kharch sync warning:', error);
  }
  return true;
}

export async function pullFromCloud() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase Config Missing! Please enter URL & Anon Key in Settings.');

  const { data: members, error: err1 } = await client.from('members').select();
  if (err1) throw err1;
  const { data: vargani, error: err2 } = await client.from('vargani').select();
  if (err2) throw err2;
  const { data: jama, error: err3 } = await client.from('jama').select();
  if (err3) throw err3;
  const { data: kharch, error: err4 } = await client.from('kharch').select();
  if (err4) throw err4;

  db.importJSON({
    members: members || [],
    vargani: vargani || [],
    jama: jama || [],
    kharch: kharch || []
  });

  return true;
}

// Background Auto-Sync when Internet is Active
export async function autoSyncCloud() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const client = getSupabase();
  if (!client) return;

  try {
    await pushToCloud();
  } catch (err) {
    console.log('Background Auto-sync postponed:', err.message);
  }
}

// Listen for network coming online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    autoSyncCloud();
  });
}
