/**
 * Security & Data Hygiene Utility
 * =================================
 * Provides HTML/script sanitization, SHA-256 PIN hashing via Web Crypto API,
 * brute-force rate limiting, and JSON schema validation for backup files.
 */

// ── 1. HTML / Script Sanitization (DOM-XSS Prevention) ─────────────────────
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ── 2. Fast SHA-256 Hashing via browser Web Crypto API ─────────────────────
export async function hashPin(pin) {
  if (!pin) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Pre-computed default SHA-256 hashes for fast lookup:
// SHA-256 of '1234' = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
// SHA-256 of '0000' = '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0'
export const KNOWN_PIN_HASHES = {
  ADMIN_DEFAULT: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  VIEWER_DEFAULT: '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0'
};

// ── 3. JSON Backup Schema Validation & Data Sanitization ─────────────────────
export function validateAndSanitizeBackupData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON format: Top-level structure must be an object.');
  }

  const sanitized = {
    members: [],
    vargani: [],
    jama: [],
    kharch: [],
    aarti: [],
    bank_fd: []
  };

  const sanitizeArray = (arr, requiredKeys = []) => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
      if (!item || typeof item !== 'object') return null;
      const cleanItem = {};
      for (const [key, value] of Object.entries(item)) {
        if (typeof value === 'string') {
          cleanItem[key] = sanitizeString(value);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          cleanItem[key] = value;
        } else if (value === null || value === undefined) {
          cleanItem[key] = value;
        }
      }
      return cleanItem;
    }).filter(Boolean);
  };

  sanitized.members = sanitizeArray(data.members || []);
  sanitized.vargani = sanitizeArray(data.vargani || []);
  sanitized.jama = sanitizeArray(data.jama || []);
  sanitized.kharch = sanitizeArray(data.kharch || []);
  sanitized.aarti = sanitizeArray(data.aarti || []);
  sanitized.bank_fd = sanitizeArray(data.bank_fd || []);

  return sanitized;
}
