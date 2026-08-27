/**
 * LIVE Supabase Database Service
 * ================================
 * Supabase is the PRIMARY database. All reads/writes go here.
 * localStorage is used ONLY as an offline cache when internet is unavailable.
 * 
 * Credentials are baked into the build via .env file — no per-device setup needed.
 */

import { createClient } from '@supabase/supabase-js';
import { db } from './db';

// ── Credentials: baked in at build time via .env ──────────────────────────
const BUILT_IN_URL = import.meta.env.VITE_SUPABASE_URL || '';
const BUILT_IN_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let _client = null;

export function getSupabase() {
  if (_client) return _client;

  // Prefer built-in .env credentials, fallback to admin-saved credentials in settings
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

// ── Generic live upsert to a Supabase table ───────────────────────────────
async function liveUpsert(table, record) {
  const client = getSupabase();
  if (!client || !navigator.onLine) return; // silent fail — local already saved

  try {
    const { error } = await client.from(table).upsert(record);
    if (error) console.warn(`[Supabase] Upsert failed for ${table}:`, error.message);
  } catch (e) {
    console.warn(`[Supabase] Upsert exception for ${table}:`, e.message);
  }
}

// ── Generic live delete from a Supabase table ────────────────────────────
async function liveDelete(table, id) {
  const client = getSupabase();
  if (!client || !navigator.onLine) return;

  try {
    const { error } = await client.from(table).delete().eq('id', id);
    if (error) console.warn(`[Supabase] Delete failed for ${table}:`, error.message);
  } catch (e) {
    console.warn(`[Supabase] Delete exception for ${table}:`, e.message);
  }
}

// ── HIGH-LEVEL LIVE CRUD METHODS ─────────────────────────────────────────
// These are called by modules instead of db.addVargani / db.updateVargani etc.

// VARGANI (Donations)
export async function liveGetVargani(year = null) {
  const data = await liveRead('vargani', () => db.getVargani(year));
  if (data && navigator.onLine) {
    localStorage.setItem('rajmudra_vargani', JSON.stringify(data));
  }
  if (year) return data.filter(v => v.year === year);
  return data;
}

export async function liveAddVargani(record) {
  const newItem = db.addVargani(record); // save to local cache first (instant UI)
  await liveUpsert('vargani', newItem);
  return newItem;
}

export async function liveUpdateVargani(id, data) {
  const updated = db.updateVargani(id, data);
  if (updated) await liveUpsert('vargani', updated);
  return updated;
}

export async function liveDeleteVargani(id) {
  db.deleteVargani(id);
  await liveDelete('vargani', id);
}

// JAMA (Income)
export async function liveGetJama(year = null) {
  const data = await liveRead('jama', () => db.getJama(year));
  if (data && navigator.onLine) localStorage.setItem('rajmudra_jama', JSON.stringify(data));
  if (year) return data.filter(j => j.year === year);
  return data;
}

export async function liveAddJama(record) {
  const newItem = db.addJama(record);
  await liveUpsert('jama', newItem);
  return newItem;
}

export async function liveUpdateJama(id, data) {
  const updated = db.updateJama(id, data);
  if (updated) await liveUpsert('jama', updated);
  return updated;
}

export async function liveDeleteJama(id) {
  db.deleteJama(id);
  await liveDelete('jama', id);
}

// KHARCH (Expenses)
export async function liveGetKharch(year = null) {
  const data = await liveRead('kharch', () => db.getKharch(year));
  if (data && navigator.onLine) localStorage.setItem('rajmudra_kharch', JSON.stringify(data));
  if (year) return data.filter(k => k.year === year);
  return data;
}

export async function liveAddKharch(record) {
  const newItem = db.addKharch(record);
  await liveUpsert('kharch', newItem);
  return newItem;
}

export async function liveUpdateKharch(id, data) {
  const updated = db.updateKharch(id, data);
  if (updated) await liveUpsert('kharch', updated);
  return updated;
}

export async function liveDeleteKharch(id) {
  db.deleteKharch(id);
  await liveDelete('kharch', id);
}

// AARTI
export async function liveGetAarti(year = null) {
  const data = await liveRead('aarti', () => db.getAarti(year));
  if (data && navigator.onLine) localStorage.setItem('rajmudra_aarti', JSON.stringify(data));
  if (year) return data.filter(a => a.year === year);
  return data;
}

export async function liveAddAarti(record) {
  const newItem = db.addAarti(record);
  await liveUpsert('aarti', newItem);
  return newItem;
}

export async function liveUpdateAarti(id, data) {
  const updated = db.updateAarti(id, data);
  if (updated) await liveUpsert('aarti', updated);
  return updated;
}

export async function liveDeleteAarti(id) {
  db.deleteAarti(id);
  await liveDelete('aarti', id);
}

// BANK FD
export async function liveGetBankFD(year = null) {
  const data = await liveRead('bank_fd', () => db.getBankFD(year));
  if (data && navigator.onLine) localStorage.setItem('rajmudra_bank_fd', JSON.stringify(data));
  if (year) return data.filter(b => b.year === year);
  return data;
}

export async function liveAddBankFD(record) {
  const newItem = db.addBankFD(record);
  await liveUpsert('bank_fd', newItem);
  return newItem;
}

export async function liveUpdateBankFD(id, data) {
  const updated = db.updateBankFD(id, data);
  if (updated) await liveUpsert('bank_fd', updated);
  return updated;
}

export async function liveDeleteBankFD(id) {
  db.deleteBankFD(id);
  await liveDelete('bank_fd', id);
}

// MEMBERS
export async function liveGetMembers(year = null) {
  const data = await liveRead('members', () => db.getMembersRaw());
  if (data && navigator.onLine) localStorage.setItem('rajmudra_members', JSON.stringify(data));
  return data;
}

// ── BULK BACKUP OPERATIONS (for Settings: JSON export only) ──────────────
export async function pushToCloud() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured. Add credentials in Settings.');

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
      if (error) console.warn(`[Supabase] Bulk push warning for ${table}:`, error);
    }
  }
  return true;
}

export async function pullFromCloud() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured. Add credentials in Settings.');

  const fetches = await Promise.all([
    client.from('members').select(),
    client.from('vargani').select(),
    client.from('jama').select(),
    client.from('kharch').select(),
    client.from('aarti').select(),
    client.from('bank_fd').select()
  ]);

  const [members, vargani, jama, kharch, aarti, bank_fd] = fetches.map(r => r.data || []);

  db.importJSON({ members, vargani, jama, kharch, aarti, bank_fd });
  return true;
}

// ── AUTO-SYNC on reconnect (pushes any offline local changes) ─────────────
export async function autoPullCloud() {
  if (!navigator.onLine) return false;
  const client = getSupabase();
  if (!client) return false;

  try {
    await pullFromCloud();
    return true;
  } catch (e) {
    console.warn('[Supabase] Auto-pull failed:', e.message);
    return false;
  }
}

// Listen for network reconnection → push any offline writes
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    const client = getSupabase();
    if (!client) return;
    try { await pushToCloud(); } catch (e) {}
  });
}
