/**
 * LIVE Supabase Database Service
 * ================================
 * Non-blocking local execution + bidirectional cloud sync + Realtime multi-phone listener.
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
    _client = createClient(url, key, {
      auth: { persistSession: false }
    });
    return _client;
  } catch (e) {
    console.error('[Supabase] Init Error:', e);
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
    console.warn(`[Supabase] Read failed for ${table}:`, e.message);
    return fallbackFn();
  }
}

// ── Generic live upsert to a Supabase table (NON-BLOCKING BACKGROUND PUSH) ──
function liveUpsert(table, record) {
  const client = getSupabase();
  if (!client || !navigator.onLine) return;

  client.from(table).upsert(record).then(({ error }) => {
    if (error) {
      console.error(`[Supabase] Upsert ERROR for table '${table}':`, error.message, error.details);
    } else {
      console.log(`[Supabase] Successfully synced 1 record to '${table}'`);
    }
  }).catch(e => {
    console.error(`[Supabase] Upsert exception for table '${table}':`, e.message);
  });
}

// ── Generic live delete from a Supabase table (NON-BLOCKING BACKGROUND DELETE) ──
function liveDelete(table, id) {
  const client = getSupabase();
  if (!client || !navigator.onLine) return;

  client.from(table).delete().eq('id', id).then(({ error }) => {
    if (error) console.error(`[Supabase] Delete ERROR for table '${table}':`, error.message);
  }).catch(e => {
    console.error(`[Supabase] Delete exception for table '${table}':`, e.message);
  });
}

// ── HIGH-LEVEL INSTANT CRUD METHODS ─────────────────────────────────────────

// VARGANI (Donations)
export async function liveGetVargani(year = null) {
  const data = await liveRead('vargani', () => db.getVargani(year));
  if (data && data.length && navigator.onLine) {
    localStorage.setItem('rajmudra_vargani', JSON.stringify(data));
  }
  if (year) return data.filter(v => v.year === year);
  return data;
}

export function liveAddVargani(record) {
  const newItem = db.addVargani(record);
  liveUpsert('vargani', newItem);
  return newItem;
}

export function liveUpdateVargani(id, data) {
  const updated = db.updateVargani(id, data);
  if (updated) liveUpsert('vargani', updated);
  return updated;
}

export function liveDeleteVargani(id) {
  db.deleteVargani(id);
  liveDelete('vargani', id);
}

// JAMA (Income)
export async function liveGetJama(year = null) {
  const data = await liveRead('jama', () => db.getJama(year));
  if (data && data.length && navigator.onLine) {
    localStorage.setItem('rajmudra_jama', JSON.stringify(data));
  }
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
  if (data && data.length && navigator.onLine) {
    localStorage.setItem('rajmudra_kharch', JSON.stringify(data));
  }
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
  if (data && data.length && navigator.onLine) {
    localStorage.setItem('rajmudra_aarti', JSON.stringify(data));
  }
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
  if (data && data.length && navigator.onLine) {
    localStorage.setItem('rajmudra_bank_fd', JSON.stringify(data));
  }
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
  if (data && data.length && navigator.onLine) {
    localStorage.setItem('rajmudra_members', JSON.stringify(data));
  }
  return data;
}

// ── BULK BIDIRECTIONAL SYNC ─────────────────────────────────────────────
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
      const { error } = await client.from(table).upsert(rows);
      if (error) console.warn(`[Supabase] Push warning for ${table}:`, error.message);
    }
  }
  return true;
}

export async function pullFromCloud() {
  const client = getSupabase();
  if (!client) return false;

  try {
    const fetches = await Promise.all([
      client.from('members').select(),
      client.from('vargani').select(),
      client.from('jama').select(),
      client.from('kharch').select(),
      client.from('aarti').select(),
      client.from('bank_fd').select()
    ]);

    const [membersRes, varganiRes, jamaRes, kharchRes, aartiRes, bank_fdRes] = fetches;

    let hasAnyData = false;
    const payload = {};

    if (membersRes.data && membersRes.data.length) { payload.members = membersRes.data; hasAnyData = true; }
    if (varganiRes.data && varganiRes.data.length) { payload.vargani = varganiRes.data; hasAnyData = true; }
    if (jamaRes.data && jamaRes.data.length) { payload.jama = jamaRes.data; hasAnyData = true; }
    if (kharchRes.data && kharchRes.data.length) { payload.kharch = kharchRes.data; hasAnyData = true; }
    if (aartiRes.data && aartiRes.data.length) { payload.aarti = aartiRes.data; hasAnyData = true; }
    if (bank_fdRes.data && bank_fdRes.data.length) { payload.bank_fd = bank_fdRes.data; hasAnyData = true; }

    if (hasAnyData) {
      db.importJSON(payload);
      return true;
    }
  } catch (e) {
    console.warn('[Supabase] pullFromCloud error:', e.message);
  }
  return false;
}

export async function autoPullCloud() {
  if (!navigator.onLine) return false;
  const client = getSupabase();
  if (!client) return false;

  try {
    // 1. First push local unsynced records to cloud
    await pushToCloud();
    // 2. Then pull latest records from cloud to local storage
    return await pullFromCloud();
  } catch (e) {
    console.warn('[Supabase] Auto-sync error:', e.message);
    return false;
  }
}

// ── REAL-TIME MULTI-PHONE SYNC SETUP ───────────────────────────────────────
export function setupRealtimeSync(onSyncCallback) {
  const client = getSupabase();
  if (!client) return () => {};

  // 1. Initial push + pull
  autoPullCloud().then(didPull => {
    if (onSyncCallback) onSyncCallback();
  });

  // 2. Realtime WebSocket listener
  if (!_realtimeChannel) {
    _realtimeChannel = client
      .channel('public:db_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, async () => {
        await pullFromCloud();
        if (onSyncCallback) onSyncCallback();
      })
      .subscribe();
  }

  // 3. Periodic sync timer every 5 seconds
  const syncInterval = setInterval(async () => {
    if (navigator.onLine) {
      const didPull = await pullFromCloud();
      if (didPull && onSyncCallback) onSyncCallback();
    }
  }, 5000);

  return () => {
    clearInterval(syncInterval);
  };
}

// Listen for network reconnection → push offline writes
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    const client = getSupabase();
    if (!client) return;
    try { await autoPullCloud(); } catch (e) {}
  });
}
