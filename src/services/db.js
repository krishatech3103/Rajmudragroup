// Offline Database Service using LocalStorage with JSON Export/Import capabilities

const KEYS = {
  SETTINGS: 'rajmudra_settings',
  MEMBERS: 'rajmudra_members',
  VARGANI: 'rajmudra_vargani',
  JAMA: 'rajmudra_jama',
  KHARCH: 'rajmudra_kharch',
  AARTI: 'rajmudra_aarti'
};

// Initial default settings
const defaultSettings = {
  active_year: '2026-27',
  admin_pin: '1234',
  viewer_pin: '0000',
  supabase_url: '',
  supabase_key: ''
};

// Pre-seeded Official Locked Audit Records for 2024 & 2025
const initialJamaRecords = [
  {
    id: 'audit_2024_jama_1',
    title: 'सर्व जमा झालेली वर्गणी (Official Audit 2024)',
    category: 'Donations',
    amount: 33376,
    date: '2024-09-07',
    year: '2024-25',
    note: 'Official Audit Record 2024 (Non-editable)',
    is_locked: true,
    created_at: new Date('2024-09-07').toISOString()
  },
  {
    id: 'audit_2025_jama_1',
    title: 'सर्व जमा झालेली वर्गणी (Official Audit 2025)',
    category: 'Donations',
    amount: 45664,
    date: '2025-08-27',
    year: '2025-26',
    note: 'Official Audit Record 2025 (Non-editable)',
    is_locked: true,
    created_at: new Date('2025-08-27').toISOString()
  },
  {
    id: 'audit_2025_jama_2',
    title: 'मंडळाची शिल्लक असणारी वर्गणीची ठेव पावती (Fixed Deposit Receipt)',
    category: 'Sponsorship / Awards',
    amount: 46216,
    date: '2025-08-28',
    year: '2025-26',
    note: 'Mandal Fixed Deposit Receipt 2025 (Non-editable)',
    is_locked: true,
    created_at: new Date('2025-08-28').toISOString()
  }
];

const initialKharchRecords = [
  {
    id: 'audit_2024_kharch_1',
    title: 'सर्व झालेला खर्च (2024)',
    category: 'Other Expense',
    amount: 32632,
    date: '2024-09-17',
    year: '2024-25',
    note: 'Official Audit Record 2024 (Non-editable)',
    is_locked: true,
    created_at: new Date('2024-09-17').toISOString()
  },
  {
    id: 'audit_2024_kharch_2',
    title: 'कॉलनी बोर्ड करण्यासाठी खर्च (2024)',
    category: 'Other Expense',
    amount: 744,
    date: '2024-09-18',
    year: '2024-25',
    note: 'Official Audit Record 2024 (Non-editable)',
    is_locked: true,
    created_at: new Date('2024-09-18').toISOString()
  },
  {
    id: 'audit_2025_kharch_1',
    title: 'सर्व झालेला खर्च (2025)',
    category: 'Other Expense',
    amount: 42745,
    date: '2025-09-06',
    year: '2025-26',
    note: 'Official Audit Record 2025 (Non-editable)',
    is_locked: true,
    created_at: new Date('2025-09-06').toISOString()
  }
];

class DBService {
  constructor() {
    this._init();
  }

  _init() {
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }
    if (!localStorage.getItem(KEYS.MEMBERS)) localStorage.setItem(KEYS.MEMBERS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.VARGANI)) localStorage.setItem(KEYS.VARGANI, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.AARTI)) localStorage.setItem(KEYS.AARTI, JSON.stringify([]));

    // Seed Jama records with audit 2024 & 2025 if missing
    let jamaList = JSON.parse(localStorage.getItem(KEYS.JAMA) || '[]');
    let jamaChanged = false;
    initialJamaRecords.forEach(rec => {
      if (!jamaList.some(j => j.id === rec.id)) {
        jamaList.push(rec);
        jamaChanged = true;
      }
    });
    if (jamaChanged || !localStorage.getItem(KEYS.JAMA)) {
      localStorage.setItem(KEYS.JAMA, JSON.stringify(jamaList));
    }

    // Seed Kharch records with audit 2024 & 2025 if missing
    let kharchList = JSON.parse(localStorage.getItem(KEYS.KHARCH) || '[]');
    let kharchChanged = false;
    initialKharchRecords.forEach(rec => {
      if (!kharchList.some(k => k.id === rec.id)) {
        kharchList.push(rec);
        kharchChanged = true;
      }
    });
    if (kharchChanged || !localStorage.getItem(KEYS.KHARCH)) {
      localStorage.setItem(KEYS.KHARCH, JSON.stringify(kharchList));
    }

    // Auto-clean Aarti entries older than 30 days
    this.cleanOldAarti();
  }

  // Auto-delete Aarti schedule entries older than 30 days to avoid unnecessary DB load
  cleanOldAarti() {
    const list = JSON.parse(localStorage.getItem(KEYS.AARTI) || '[]');
    if (list.length === 0) return;

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const filtered = list.filter(item => {
      if (!item.date) return true;
      const itemDateMs = new Date(item.date).getTime();
      return (now - itemDateMs) <= thirtyDaysMs;
    });

    if (filtered.length !== list.length) {
      localStorage.setItem(KEYS.AARTI, JSON.stringify(filtered));
    }
  }

  // ── SETTINGS ─────────────────────────────────────────────────────────────
  getSettings() {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{}') };
  }

  setSetting(key, value) {
    const s = this.getSettings();
    s[key] = value;
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(s));
  }

  // ── MEMBERS ───────────────────────────────────────────────────────────────
  getMembers() {
    return JSON.parse(localStorage.getItem(KEYS.MEMBERS) || '[]');
  }

  upsertMember(name, phone = '', address = '') {
    const members = this.getMembers();
    const cleanName = name.trim();
    const existing = members.find(m => m.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) return existing;

    const newMember = {
      id: Date.now(),
      name: cleanName,
      phone: phone.trim(),
      address: address.trim(),
      created_at: new Date().toISOString()
    };
    members.push(newMember);
    localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
    return newMember;
  }

  getMemberHistory(memberId) {
    const vargani = this.getVargani();
    const filtered = vargani.filter(v => v.member_id === memberId);
    
    // Group by year
    const yearlyMap = {};
    filtered.forEach(v => {
      yearlyMap[v.year] = (yearlyMap[v.year] || 0) + Number(v.amount);
    });

    return Object.entries(yearlyMap).map(([year, total]) => ({ year, total }));
  }

  // ── VARGANI ───────────────────────────────────────────────────────────────
  getVargani(year = null) {
    const list = JSON.parse(localStorage.getItem(KEYS.VARGANI) || '[]');
    if (year) return list.filter(v => v.year === year);
    return list;
  }

  addVargani(data) {
    const list = this.getVargani();
    const newItem = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString()
    };
    list.unshift(newItem);
    localStorage.setItem(KEYS.VARGANI, JSON.stringify(list));
    return newItem;
  }

  updateVargani(id, data) {
    const list = this.getVargani();
    const idx = list.findIndex(v => v.id === id);
    if (idx !== -1) {
      if (list[idx].is_locked) {
        alert('Official Audit Record is non-editable!');
        return;
      }
      list[idx] = { ...list[idx], ...data };
      localStorage.setItem(KEYS.VARGANI, JSON.stringify(list));
    }
  }

  deleteVargani(id) {
    const list = this.getVargani();
    const target = list.find(v => v.id === id);
    if (target && target.is_locked) {
      alert('Official Audit Record cannot be deleted!');
      return;
    }
    const filtered = list.filter(v => v.id !== id);
    localStorage.setItem(KEYS.VARGANI, JSON.stringify(filtered));
  }

  // ── JAMA ─────────────────────────────────────────────────────────────────
  getJama(year = null) {
    const list = JSON.parse(localStorage.getItem(KEYS.JAMA) || '[]');
    if (year) return list.filter(j => j.year === year);
    return list;
  }

  addJama(data) {
    const list = this.getJama();
    const newItem = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString()
    };
    list.unshift(newItem);
    localStorage.setItem(KEYS.JAMA, JSON.stringify(list));
    return newItem;
  }

  updateJama(id, data) {
    const list = this.getJama();
    const idx = list.findIndex(j => j.id === id);
    if (idx !== -1) {
      if (list[idx].is_locked) {
        alert('Official Audit Record is non-editable!');
        return;
      }
      list[idx] = { ...list[idx], ...data };
      localStorage.setItem(KEYS.JAMA, JSON.stringify(list));
    }
  }

  deleteJama(id) {
    const list = this.getJama();
    const target = list.find(j => j.id === id);
    if (target && target.is_locked) {
      alert('Official Audit Record cannot be deleted!');
      return;
    }
    const filtered = list.filter(j => j.id !== id);
    localStorage.setItem(KEYS.JAMA, JSON.stringify(filtered));
  }

  // ── KHARCH ────────────────────────────────────────────────────────────────
  getKharch(year = null) {
    const list = JSON.parse(localStorage.getItem(KEYS.KHARCH) || '[]');
    if (year) return list.filter(k => k.year === year);
    return list;
  }

  addKharch(data) {
    const list = this.getKharch();
    const newItem = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString()
    };
    list.unshift(newItem);
    localStorage.setItem(KEYS.KHARCH, JSON.stringify(list));
    return newItem;
  }

  updateKharch(id, data) {
    const list = this.getKharch();
    const idx = list.findIndex(k => k.id === id);
    if (idx !== -1) {
      if (list[idx].is_locked) {
        alert('Official Audit Record is non-editable!');
        return;
      }
      list[idx] = { ...list[idx], ...data };
      localStorage.setItem(KEYS.KHARCH, JSON.stringify(list));
    }
  }

  deleteKharch(id) {
    const list = this.getKharch();
    const target = list.find(k => k.id === id);
    if (target && target.is_locked) {
      alert('Official Audit Record cannot be deleted!');
      return;
    }
    const filtered = list.filter(k => k.id !== id);
    localStorage.setItem(KEYS.KHARCH, JSON.stringify(filtered));
  }

  // ── AARTI SCHEDULE ────────────────────────────────────────────────────────
  getAarti(year = null) {
    this.cleanOldAarti();
    const list = JSON.parse(localStorage.getItem(KEYS.AARTI) || '[]');
    if (year) return list.filter(a => a.year === year);
    return list;
  }

  addAarti(data) {
    const list = this.getAarti();
    const newItem = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString()
    };
    list.push(newItem);
    localStorage.setItem(KEYS.AARTI, JSON.stringify(list));
    return newItem;
  }

  updateAarti(id, data) {
    const list = this.getAarti();
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      localStorage.setItem(KEYS.AARTI, JSON.stringify(list));
    }
  }

  deleteAarti(id) {
    const list = this.getAarti();
    const filtered = list.filter(a => a.id !== id);
    localStorage.setItem(KEYS.AARTI, JSON.stringify(filtered));
  }

  // ── CALCULATIONS ─────────────────────────────────────────────────────────
  getSummary(year) {
    const vargani = this.getVargani(year).reduce((sum, v) => sum + Number(v.amount), 0);
    const jama = this.getJama(year).reduce((sum, j) => sum + Number(j.amount), 0);
    const kharch = this.getKharch(year).reduce((sum, k) => sum + Number(k.amount), 0);
    const income = vargani + jama;
    const balance = income - kharch;

    return { vargani, jama, kharch, income, balance };
  }

  getKharchByCategory(year) {
    const list = this.getKharch(year);
    const map = {};
    list.forEach(k => {
      map[k.category] = (map[k.category] || 0) + Number(k.amount);
    });
    return Object.entries(map).map(([category, total]) => ({ category, total }));
  }

  // ── FULL EXPORT / IMPORT (BACKUP) ─────────────────────────────────────────
  exportJSON() {
    return {
      app: 'Rajmudra Ganesh Utsav Mandal',
      exported_at: new Date().toISOString(),
      settings: this.getSettings(),
      members: this.getMembers(),
      vargani: this.getVargani(),
      jama: this.getJama(),
      kharch: this.getKharch(),
      aarti: this.getAarti()
    };
  }

  importJSON(data) {
    if (!data.vargani || !data.members) {
      throw new Error('अवैध बॅकअप फाइल format!');
    }
    if (data.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
    if (data.members) localStorage.setItem(KEYS.MEMBERS, JSON.stringify(data.members));
    if (data.vargani) localStorage.setItem(KEYS.VARGANI, JSON.stringify(data.vargani));
    if (data.jama) localStorage.setItem(KEYS.JAMA, JSON.stringify(data.jama));
    if (data.kharch) localStorage.setItem(KEYS.KHARCH, JSON.stringify(data.kharch));
    if (data.aarti) localStorage.setItem(KEYS.AARTI, JSON.stringify(data.aarti));
  }
}

export const db = new DBService();
