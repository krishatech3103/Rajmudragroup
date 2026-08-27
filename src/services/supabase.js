/**
 * LIVE Supabase Database Service
 * ================================
 * Non-blocking, instant local UI response + background Supabase cloud sync + Realtime multi-phone listener.
 */

import { createClient } from '@supabase/supabase-js';
import { db } from './db';

// ── Credentials: baked in at build time via .env ──────────────────────────
const BUILT_IN_URL = import.meta.env.VITE_SUPABASE_URL || '';
const BUILT_IN_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let _client = null;
let _realtimeChannel = null;

export function getSupabase() {
  if (_client) return _client;

  const settings = db.getSettings();
  const url = (BUILT_IN_URL || settings.supabase_url || '').trim();
  const key = (BUILT_IN_KEY || settings.supabase_key || '').trim();

  if (!url || !key) return null;

  try {
    _client = createClient(url, key);
    return _client;
  } catch (e) {
    console.error('Supabase Init Error:', e);
    return null;
  }
}

export function isCloudConnected() {
  return !!getSupabase();
}

// ── Generic live read from a Supabase table ───────────────────────────────
async function liveRead(table, fallbackFn) {
  if (!navigator.onLine) return fallbackFn();
  const client = getSupabase();
  if (!client) return fallbackFn();

  try {
    const { data, error } = await client.from(table).select();
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn(`[Supabase] Read failed for ${table}, using local cache:`, e.message);
    return fallbackFn();
  }
}

// ── Generic live upsert to a Supabase table (NON-BLOCKING BACKGROUND PUSH) ──
function liveUpsert(table, record) {
  const client = getSupabase();
  if (!client || !navigator.onLine) return;

  // Non-blocking async execution
  client.from(table).upsert(record).then(({ error }) => {
    if (error) console.warn(`[Supabase] Upsert warning for ${table}:`, error.message);
  }).catch(e => {
    console.warn(`[Supabase] Upsert exception for ${table}:`, e.message);
  });
}

// ── Generic live delete from a Supabase table (NON-BLOCKING BACKGROUND DELETE) ──
function liveDelete(table, id) {
  const client = getSupabase();
  if (!client || !navigator.onLine) return;

  client.from(table).delete().eq('id', id).then(({ error }) => {
    if (error) console.warn(`[Supabase] Delete warning for ${table}:`, error.message);
  }).catch(e => {
    console.warn(`[Supabase] Delete exception for ${table}:`, e.message);
  });
}

// ── HIGH-LEVEL INSTANT CRUD METHODS ─────────────────────────────────────────
// VARGANI (Donations)
export async function liveGetVargani(year = null) {
  const data = await liveRead('vargani', () => db.getVargani(year));
  if (data && navigator.onLine) {
    localStorage.setItem('rajmudra_vargani', JSON.stringify(data));
  }
  if (year) return data.filter(v => v.year === year);
  return data;
}

export function liveAddVargani(record) {
  const newItem = db.addVargani(record); // 1. Local instant update (0ms)
  liveUpsert('vargani', newItem);        // 2. Background push
  return newItem;
}

export function liveUpdateVargani(id, data) {
  const updated = db.updateVargani(id, data); // 1. Local instant update (0ms)
  if (updated) liveUpsert('vargani', updated); // 2. Background push
  return updated;
}

export function liveDeleteVargani(id) {
  db.deleteVargani(id);
  liveDelete('vargani', id);
}

// JAMA (Income)
export async function liveGetJama(year = null) {
  const data = await liveRead('jama', () => db.getJama(year));
  if (data && navigator.onLine) localStorage.setItem('rajmudra_jama', JSON.stringify(data));
  if (year) return data.filter(j => j.year === year);
  return data;
}

export function liveAddJama(record) {
  const newItem = db.addJama(record);
  liveUpsert('jama', newItem);
  return newItem;
}

export function liveUpdateJama(id, data) {
  const updated = db.updateJama(id, data);
  if (updated) liveUpsert('jama', updated);
  return updated;
}

export function liveDeleteJama(id) {
  db.deleteJama(id);
  liveDelete('jama', id);
}

// KHARCH (Expenses)
export async function liveGetKharch(year = null) {
  const data = await liveRead('kharch', () => db.getKharch(year));
  if (data && navigator.onLine) localStorage.setItem('rajmudra_kharch', JSON.stringify(data));
  if (year) return data.filter(k => k.year === year);
  return data;
}

export function liveAddKharch(record) {
  const newItem = db.addKharch(record);
  liveUpsert('kharch', newItem);
  return newItem;
}

export function liveUpdateKharch(id, data) {
  const updated = db.updateKharch(id, data);
  if (updated) liveUpsert('kharch', updated);
  return updated;
}

export function liveDeleteKharch(id) {
  db.deleteKharch(id);
  liveDelete('kharch', id);
}

// AARTI
export async function liveGetAarti(year = null) {
  const data = await liveRead('aarti', () => db.getAarti(year));
  if (data && navigator.onLine) localStorage.setItem('rajmudra_aarti', JSON.stringify(data));
  if (year) return data.filter(a => a.year === year);
  return data;
}

export function liveAddAarti(record) {
  const newItem = db.addAarti(record);
  liveUpsert('aarti', newItem);
  return newItem;
}

export function liveUpdateAarti(id, data) {
  const updated = db.updateAarti(id, data);
  if (updated) liveUpsert('aarti', updated);
  return updated;
}

export function liveDeleteAarti(id) {
  db.deleteAarti(id);
  liveDelete('aarti', id);
}

// BANK FD
export async function liveGetBankFD(year = null) {
  const data = await liveRead('bank_fd', () => db.getBankFD(year));
  if (data && navigator.onLine) localStorage.setItem('rajmudra_bank_fd', JSON.stringify(data));
  if (year) return data.filter(b => b.year === year);
  return data;
}

export function liveAddBankFD(record) {
  const newItem = db.addBankFD(record);
  liveUpsert('bank_fd', newItem);
  return newItem;
}

export function liveUpdateBankFD(id, data) {
  const updated = db.updateBankFD(id, data);
  if (updated) liveUpsert('bank_fd', updated);
  return updated;
}

export function liveDeleteBankFD(id) {
  db.deleteBankFD(id);
  liveDelete('bank_fd', id);
}

// MEMBERS
export async function liveGetMembers(year = null) {
  const data = await liveRead('members', () => db.getMembersRaw());
  if (data && navigator.onLine) localStorage.setItem('rajmudra_members', JSON.stringify(data));
  return data;
}

// ── BULK BACKUP OPERATIONS ─────────────────────────────────────────────
export async function pushToCloud() {
  const client = getSupabase();
  if (!client) return false;

  const backupData = db.exportJSON();
  const tables = [
    ['members', backupData.members],
    ['vargani', backupData.vargani],
    ['jama', backupData.jama],
    ['kharch', backupData.kharch],
    ['aarti', backupData.aarti],
    ['bank_fd', backupData.bank_fd]
  ];

  for (const [table, rows] of tables) {
    if (rows && rows.length > 0) {
      await client.from(table).upsert(rows);
    }
  }
  return true;
}

export async function pullFromCloud() {
  const client = getSupabase();
  if (!client) return false;

  const fetches = await Promise.all([
    client.from('members').select(),
    client.from('vargani').select(),
    client.from('jama').select(),
    client.from('kharch').select(),
    client.from('aarti').select(),
    client.from('bank_fd').select()
  ]);

  const [members, vargani, jama, kharch, aarti, bank_fd] = fetches.map(r => r.data || []);

  // Only import if data was successfully received
  if (members.length || vargani.length || jama.length || kharch.length || aarti.length || bank_fd.length) {
    db.importJSON({ members, vargani, jama, kharch, aarti, bank_fd });
    return true;
  }
  return false;
}

export async function autoPullCloud() {
  if (!navigator.onLine) return false;
  const client = getSupabase();
  if (!client) return false;

  try {
    return await pullFromCloud();
  } catch (e) {
    console.warn('[Supabase] Auto-pull error:', e.message);
    return false;
  }
}

// ── REAL-TIME MULTI-PHONE SYNC SETUP ───────────────────────────────────────
export function setupRealtimeSync(onSyncCallback) {
  const client = getSupabase();
  if (!client) return () => {};

  // 1. Initial silent background sync
  autoPullCloud().then(didPull => {
    if (didPull && onSyncCallback) onSyncCallback();
  });

  // 2. Realtime WebSocket listener for instant multi-phone synchronization
  if (!_realtimeChannel) {
    _realtimeChannel = client
      .channel('public:db_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, async () => {
        const didPull = await autoPullCloud();
        if (didPull && onSyncCallback) onSyncCallback();
      })
      .subscribe();
  }

  // 3. Background periodic sync interval (every 10 seconds)
  const syncInterval = setInterval(async () => {
    if (navigator.onLine) {
      const didPull = await autoPullCloud();
      if (didPull && onSyncCallback) onSyncCallback();
    }
  }, 10000);

  return () => {
    clearInterval(syncInterval);
  };
}

// Listen for network reconnection → push offline writes
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    const client = getSupabase();
    if (!client) return;
    try { await pushToCloud(); } catch (e) {}
  });
}
