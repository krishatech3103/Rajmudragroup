/**
 * Supabase data access layer
 *
 * This module is deliberately server-authoritative. Ledger records are never
 * read from or written to browser storage, queued offline, or merged back
 * into the database. Supabase Auth persists only its signed-in session so a
 * legitimate user stays signed in across a refresh.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const AUTH_USERNAME_DOMAIN = (import.meta.env.VITE_AUTH_USERNAME_DOMAIN || '').trim().toLowerCase();

export const SETTINGS_TABLE = 'app_settings';
export const DATA_TABLES = Object.freeze([
  'members',
  'vargani',
  'jama',
  'kharch',
  'aarti',
  'bank_fd'
]);

export const DEFAULT_SETTINGS = Object.freeze({
  active_year: '2026-27'
});

const YEAR_TABLES = Object.freeze(['vargani', 'jama', 'kharch', 'aarti', 'bank_fd']);
const DEFAULT_YEARS = Object.freeze(['2024-25', '2025-26', '2026-27']);
const PAGE_SIZE = 1000;
const GLOBAL_SETTINGS_KEY = 'global';
const SECRET_SETTING_KEYS = new Set([
  'admin_pin',
  'viewer_pin',
  'supabase_url',
  'supabase_key'
]);

let client = null;
let subscriptionSequence = 0;

/**
 * Returns the configured Supabase client, or null when build-time credentials
 * are absent. Database functions below throw a descriptive error in that case
 * so UI code can display a useful connection error.
 */
export function getSupabase() {
  if (client) return client;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      // This stores Supabase's signed session token, not ledger data or a
      // password. It lets Auth restore the same user after an app refresh.
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'rajmudra_supabase_auth'
      }
    });
  } catch (error) {
    throw toSupabaseError('initialize client', 'configuration', error);
  }

  return client;
}

function requireSupabase() {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(
      'The data connection is not configured. Please contact the administrator.'
    );
  }
  return supabase;
}

function assertDataTable(table) {
  if (!DATA_TABLES.includes(table)) {
    throw new Error(`Unsupported data table "${table}".`);
  }
  return table;
}

function assertRecord(value, label = 'record') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

function assertId(id) {
  if (id === undefined || id === null || id === '') {
    throw new Error('A record id is required.');
  }
  return id;
}

function toSupabaseError(operation, table, error) {
  const wrapped = new Error(
    `Could not ${operation} the data. Please check your connection and try again.`
  );
  if (error?.code) wrapped.code = error.code;
  if (error) wrapped.cause = error;
  return wrapped;
}

function assertResult(operation, table, result) {
  if (result.error) throw toSupabaseError(operation, table, result.error);
  return result.data;
}

function sortYears(years) {
  return [...years].sort((left, right) => {
    const leftStart = Number.parseInt(String(left).slice(0, 4), 10);
    const rightStart = Number.parseInt(String(right).slice(0, 4), 10);
    if (Number.isNaN(leftStart) || Number.isNaN(rightStart)) {
      return String(left).localeCompare(String(right));
    }
    return leftStart - rightStart || String(left).localeCompare(String(right));
  });
}

function normaliseYear(year) {
  const value = String(year || '').trim();
  if (!value) throw new Error('A fiscal year is required.');
  return value;
}

// ── Authentication and roles ──────────────────────────────────────────────

async function getAuthorizedUser(user) {
  if (!user?.id) throw new Error('Could not confirm the signed-in user. Please try again.');

  const supabase = requireSupabase();
  const result = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  const roleRow = assertResult('read role', 'user_roles', result);
  const role = roleRow?.role;

  if (role !== 'admin' && role !== 'viewer') {
    throw new Error('This account has no Rajmudra access role. Ask an administrator to assign it as admin or viewer.');
  }

  return {
    id: user.id,
    email: user.email || '',
    role
  };
}

/** Signs in with Supabase Auth and verifies the server-assigned app role. */
export async function signInWithPassword(email, password) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');
  if (!cleanEmail || !cleanPassword) {
    throw new Error('Enter both email address and password.');
  }

  const supabase = requireSupabase();
  const result = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: cleanPassword
  });
  const authData = assertResult('sign in', 'authentication', result);

  try {
    return await getAuthorizedUser(authData?.user);
  } catch (error) {
    // A valid Supabase account without an app role must not remain signed in
    // to this application.
    await supabase.auth.signOut();
    throw error;
  }
}

/**
 * Supabase password authentication needs an email internally. The UI uses a
 * username, which is converted to the private, fixed-domain Auth email here.
 * For example, username "admin" with domain "login.rajmudra.invalid" becomes
 * "admin@login.rajmudra.invalid". The domain is an environment value, never a
 * user-supplied part of the login identifier.
 */
export async function signInWithUsername(username, password) {
  const cleanUsername = String(username || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(cleanUsername)) {
    throw new Error('Username may contain only letters, numbers, dots, underscores, and hyphens.');
  }
  if (!AUTH_USERNAME_DOMAIN || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(AUTH_USERNAME_DOMAIN)) {
    throw new Error('Username login is not configured. Please contact the administrator.');
  }

  return signInWithPassword(`${cleanUsername}@${AUTH_USERNAME_DOMAIN}`, password);
}

/** Restores an existing Supabase Auth session after a browser/app refresh. */
export async function restoreAuthenticatedUser() {
  const supabase = requireSupabase();
  const result = await supabase.auth.getUser();
  // Supabase returns AuthSessionMissingError when no one has logged in on this
  // device yet. That is the normal state for the login screen, not a failure.
  if (result.error) {
    const message = String(result.error.message || '').toLowerCase();
    if (result.error.name === 'AuthSessionMissingError' || message.includes('auth session missing')) {
      return null;
    }
    throw toSupabaseError('restore session', 'authentication', result.error);
  }

  const user = result.data?.user;
  if (!user) return null;

  try {
    return await getAuthorizedUser(user);
  } catch (error) {
    await supabase.auth.signOut();
    throw error;
  }
}

/** Clears the persisted sign-in session. Local scope works even while offline. */
export async function signOut({ scope = 'global' } = {}) {
  const result = await requireSupabase().auth.signOut({ scope });
  assertResult('sign out', 'authentication', result);
}

/**
 * Read every matching row without silently truncating at PostgREST's page
 * limit. `buildQuery` receives a fresh query builder for each page.
 */
async function fetchRows(table, { columns = '*', buildQuery = query => query } = {}) {
  const supabase = requireSupabase();
  const rows = [];
  let offset = 0;

  while (true) {
    let query = supabase.from(table).select(columns);
    query = buildQuery(query);
    const result = await query.range(offset, offset + PAGE_SIZE - 1);
    const page = assertResult('read', table, result) || [];

    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
    offset += page.length;
  }
}

function applyDateOrder(query, ascending = false) {
  // The id tie-breaker prevents pagination from skipping/duplicating rows that
  // share the same date.
  return query
    .order('date', { ascending })
    .order('id', { ascending });
}

function fetchAllTable(table) {
  if (table === 'members') {
    return fetchRows(table, {
      buildQuery: query => query.order('name', { ascending: true }).order('id', { ascending: true })
    });
  }

  return fetchRows(table, {
    buildQuery: query => applyDateOrder(query, table === 'aarti')
  });
}

// ── Settings ───────────────────────────────────────────────────────────────

/**
 * Reads the singleton logical settings map from:
 *   app_settings(setting_key text unique, setting_value jsonb)
 * using the `global` row. Legacy per-key rows are read only for non-secret
 * values so an existing active_year can be migrated without persisting PINs or
 * credentials in the database.
 */
export async function fetchSettings() {
  const rows = await fetchRows(SETTINGS_TABLE, {
    columns: 'setting_key,setting_value',
    buildQuery: query => query.order('setting_key', { ascending: true })
  });

  const legacySettings = {};
  let globalSettings = {};

  rows.forEach(row => {
    if (row?.setting_key === GLOBAL_SETTINGS_KEY) {
      if (row.setting_value && typeof row.setting_value === 'object' && !Array.isArray(row.setting_value)) {
        globalSettings = row.setting_value;
      }
      return;
    }

    if (row?.setting_key && !SECRET_SETTING_KEYS.has(row.setting_key)) {
      legacySettings[row.setting_key] = row.setting_value;
    }
  });

  const nonSecretGlobalSettings = Object.fromEntries(
    Object.entries(globalSettings).filter(([key]) => !SECRET_SETTING_KEYS.has(key))
  );

  return { ...DEFAULT_SETTINGS, ...legacySettings, ...nonSecretGlobalSettings };
}

/**
 * Merges supplied settings into the `global` JSON object and returns the
 * complete server settings map. PINs and Supabase credentials are rejected:
 * authentication belongs in Supabase Auth and connection values belong in env.
 */
export async function saveSettings(settings) {
  assertRecord(settings, 'settings');
  const prohibitedKeys = Object.keys(settings).filter(key => SECRET_SETTING_KEYS.has(key));
  if (prohibitedKeys.length) {
    throw new Error(
      `Settings cannot store ${prohibitedKeys.join(', ')}. Use Supabase Auth and build-time environment variables instead.`
    );
  }

  const patch = Object.fromEntries(
    Object.entries(settings).filter(([key, value]) => key && value !== undefined)
  );

  if (Object.keys(patch).length === 0) return fetchSettings();

  const current = await fetchSettings();
  const nextSettings = { ...current, ...patch };

  const supabase = requireSupabase();
  const result = await supabase
    .from(SETTINGS_TABLE)
    .upsert({
      setting_key: GLOBAL_SETTINGS_KEY,
      setting_value: nextSettings
    }, { onConflict: 'setting_key' })
    .select('setting_key,setting_value');
  assertResult('save settings', SETTINGS_TABLE, result);

  return nextSettings;
}

// ── Reads ──────────────────────────────────────────────────────────────────

/** Fetches every fiscal year represented in Supabase, plus supported defaults. */
export async function fetchAvailableYears() {
  const yearRows = await Promise.all(
    YEAR_TABLES.map(table => fetchRows(table, {
      columns: 'year',
      buildQuery: query => query.order('year', { ascending: true }).order('id', { ascending: true })
    }))
  );

  const years = new Set(DEFAULT_YEARS);
  yearRows.flat().forEach(row => {
    if (row?.year) years.add(row.year);
  });

  return sortYears(years);
}

/**
 * Fetches the full view-model data set for a single fiscal year. Members are
 * intentionally unfiltered because they are shared across fiscal years.
 */
export async function fetchYearData(year) {
  const selectedYear = normaliseYear(year);
  const [members, vargani, jama, kharch, aarti, bank_fd] = await Promise.all([
    fetchAllTable('members'),
    fetchRows('vargani', {
      buildQuery: query => applyDateOrder(query.eq('year', selectedYear))
    }),
    fetchRows('jama', {
      buildQuery: query => applyDateOrder(query.eq('year', selectedYear))
    }),
    fetchRows('kharch', {
      buildQuery: query => applyDateOrder(query.eq('year', selectedYear))
    }),
    fetchRows('aarti', {
      buildQuery: query => applyDateOrder(query.eq('year', selectedYear), true)
    }),
    fetchAllTable('bank_fd')
  ]);

  return { year: selectedYear, members, vargani, jama, kharch, aarti, bank_fd };
}

/**
 * Returns a member's raw donation records and the per-year totals used by the
 * history modal.
 */
export async function fetchMemberHistory(memberId) {
  const id = assertId(memberId);
  const records = await fetchRows('vargani', {
    buildQuery: query => applyDateOrder(query.eq('member_id', id))
  });

  const totals = new Map();
  records.forEach(record => {
    const year = record.year || 'Unknown';
    totals.set(year, (totals.get(year) || 0) + Number(record.amount || 0));
  });

  return {
    memberId: id,
    records,
    yearlyTotals: sortYears(totals.keys()).map(year => ({ year, total: totals.get(year) }))
  };
}

// ── Awaited mutations ──────────────────────────────────────────────────────

/** Inserts one record and returns the canonical row returned by Supabase. */
export async function createRecord(table, payload) {
  const target = assertDataTable(table);
  assertRecord(payload);
  const supabase = requireSupabase();
  const result = await supabase.from(target).insert(payload).select().single();
  return assertResult('create', target, result);
}

/** Updates one record and returns the canonical row returned by Supabase. */
export async function updateRecord(table, id, payload) {
  const target = assertDataTable(table);
  assertId(id);
  assertRecord(payload);
  const supabase = requireSupabase();
  const result = await supabase.from(target).update(payload).eq('id', id).select().maybeSingle();
  const data = assertResult('update', target, result);
  if (!data) throw new Error('Could not update this record because it was not found.');
  return data;
}

/** Deletes one record and verifies that Supabase actually deleted it. */
export async function deleteRecord(table, id) {
  const target = assertDataTable(table);
  assertId(id);
  const supabase = requireSupabase();
  const result = await supabase.from(target).delete().eq('id', id).select('id').maybeSingle();
  const data = assertResult('delete', target, result);
  if (!data) throw new Error('Could not delete this record because it was not found.');
  return data;
}

/**
 * Deletes a donation and, in the same database transaction, deletes its
 * member only when that member has no remaining donation history. This avoids
 * orphan members appearing as pending after a receipt is removed.
 */
export async function deleteDonationRecord(id) {
  const donationId = assertId(id);
  const supabase = requireSupabase();
  const result = await supabase.rpc('delete_vargani_and_orphan_member', {
    p_vargani_id: donationId
  });
  const rows = assertResult('delete donation', 'vargani', result) || [];
  const row = Array.isArray(rows) ? rows[0] : rows;

  if (!row?.deleted_vargani_id) {
    throw new Error('Could not delete this donation because it was not found.');
  }

  return {
    id: row.deleted_vargani_id,
    deletedMemberId: row.deleted_member_id ?? null
  };
}

/**
 * Finds an existing member case-insensitively by name, or creates a new member
 * and returns the server-generated row. A unique normalized-name constraint or
 * RPC is still recommended to make concurrent creates fully race-free.
 */
export async function findOrCreateMember(payload, { knownMembers = [] } = {}) {
  assertRecord(payload, 'member');
  const name = String(payload.name || '').trim();
  if (!name) throw new Error('A member name is required.');

  // Most saves happen for members already loaded into the active React view.
  // Reusing that server-originated row avoids an unnecessary lookup round
  // trip. The database query below remains the authority whenever this view
  // has not seen the member yet (including another device's recent change).
  if (Array.isArray(knownMembers)) {
    const normalizedName = name.toLocaleLowerCase();
    const knownMember = knownMembers.find(member =>
      String(member?.name || '').trim().toLocaleLowerCase() === normalizedName
    );
    if (knownMember) return knownMember;
  }

  const supabase = requireSupabase();
  const result = await supabase
    .from('members')
    .select()
    .ilike('name', name)
    .order('created_at', { ascending: true })
    .limit(1);
  const members = assertResult('find member', 'members', result) || [];
  if (members[0]) return members[0];

  return createRecord('members', {
    name,
    phone: String(payload.phone || '').trim(),
    address: String(payload.address || '').trim()
  });
}

// ── Export / import ─────────────────────────────────────────────────────────

/** Fetches a complete server snapshot suitable for a JSON backup download. */
export async function fetchExportData() {
  const [settings, members, vargani, jama, kharch, aarti, bank_fd] = await Promise.all([
    fetchSettings(),
    fetchAllTable('members'),
    fetchAllTable('vargani'),
    fetchAllTable('jama'),
    fetchAllTable('kharch'),
    fetchAllTable('aarti'),
    fetchAllTable('bank_fd')
  ]);

  return {
    app: 'Rajmudra Ganesh Utsav Mandal',
    exported_at: new Date().toISOString(),
    settings,
    members,
    vargani,
    jama,
    kharch,
    aarti,
    bank_fd
  };
}

async function upsertImportRows(table, rows) {
  const target = assertDataTable(table);
  if (!rows.length) return 0;
  const supabase = requireSupabase();
  let imported = 0;

  // Chunking keeps backup restores below normal REST payload limits.
  for (let start = 0; start < rows.length; start += PAGE_SIZE) {
    const chunk = rows.slice(start, start + PAGE_SIZE);
    const result = await supabase
      .from(target)
      .upsert(chunk, { onConflict: 'id' })
      .select('id');
    const data = assertResult('import', target, result) || [];
    imported += data.length;
  }

  return imported;
}

/**
 * Safely merges a backup into Supabase using primary-key upserts. It never
 * deletes server rows that are absent from the backup; a destructive restore
 * should be an explicit, separately authorized server-side operation.
 */
export async function importData(payload) {
  assertRecord(payload, 'import payload');
  const imported = {};

  if (payload.settings !== undefined) {
    const importedSettings = assertRecord(payload.settings, 'import settings');
    // Old local backups may contain PINs or Supabase credentials. Preserve
    // harmless settings during migration, but never copy those secrets to the
    // server-side global settings document.
    const safeSettings = Object.fromEntries(
      Object.entries(importedSettings).filter(([key]) => !SECRET_SETTING_KEYS.has(key))
    );
    if (Object.keys(safeSettings).length) await saveSettings(safeSettings);
    imported.settings = Object.keys(safeSettings).length;
  }

  // Members first supports a future foreign-key relationship from vargani.
  for (const table of DATA_TABLES) {
    if (payload[table] === undefined) continue;
    if (!Array.isArray(payload[table])) {
      throw new Error(`Import field "${table}" must be an array.`);
    }
    imported[table] = await upsertImportRows(table, payload[table]);
  }

  return { imported };
}

// ── Realtime ───────────────────────────────────────────────────────────────

/**
 * Subscribes to direct database changes without polling. The callback receives
 * `{ table, eventType, new, old, payload }`; React callers can refetch only
 * the affected view. `onError` handles asynchronous channel failures.
 */
export function subscribeToDataChanges(callback, { tables, onError } = {}) {
  if (typeof callback !== 'function') {
    throw new Error('subscribeToDataChanges requires a callback function.');
  }

  const requestedTables = tables ?? [...DATA_TABLES, SETTINGS_TABLE];
  if (!Array.isArray(requestedTables) || requestedTables.length === 0) {
    throw new Error('subscribeToDataChanges requires at least one table.');
  }
  const selectedTables = [...new Set(requestedTables)];

  selectedTables.forEach(table => {
    if (table !== SETTINGS_TABLE) assertDataTable(table);
  });

  const supabase = requireSupabase();
  const channel = supabase.channel(`rajmudra:data:${++subscriptionSequence}`);

  selectedTables.forEach(table => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
      Promise.resolve(callback({
        table,
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old,
        payload
      })).catch(error => {
        if (typeof onError === 'function') onError(error);
        else console.error('Supabase realtime callback failed:', error);
      });
    });
  });

  channel.subscribe((status, error) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      const reason = error instanceof Error
        ? error
        : new Error(`Supabase realtime subscription failed with status: ${status}.`);
      if (typeof onError === 'function') onError(reason);
      else console.error(reason);
    }
  });

  return () => supabase.removeChannel(channel);
}
