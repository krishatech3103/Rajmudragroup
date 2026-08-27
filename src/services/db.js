// Offline Database Service using LocalStorage with JSON Export/Import capabilities

const KEYS = {
  SETTINGS: 'rajmudra_settings',
  MEMBERS: 'rajmudra_members',
  VARGANI: 'rajmudra_vargani',
  JAMA: 'rajmudra_jama',
  KHARCH: 'rajmudra_kharch',
  AARTI: 'rajmudra_aarti',
  BANK_FD: 'rajmudra_bank_fd'
};

// Initial default settings
const defaultSettings = {
  active_year: '2026-27',
  admin_pin: '1234',
  viewer_pin: '0000',
  supabase_url: '',
  supabase_key: ''
};

class DBService {
  constructor() {
    this._init();
  }

  _init() {
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }

    // Completely wipe all records so user starts 100% fresh with blank ledger
    if (!localStorage.getItem('rajmudra_fresh_wipe_v3')) {
      this.wipeAllData();
      localStorage.setItem('rajmudra_fresh_wipe_v3', 'true');
    }

    if (!localStorage.getItem(KEYS.MEMBERS)) localStorage.setItem(KEYS.MEMBERS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.VARGANI)) localStorage.setItem(KEYS.VARGANI, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.JAMA)) localStorage.setItem(KEYS.JAMA, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.KHARCH)) localStorage.setItem(KEYS.KHARCH, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.AARTI)) localStorage.setItem(KEYS.AARTI, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.BANK_FD)) localStorage.setItem(KEYS.BANK_FD, JSON.stringify([]));

    // Auto-clean Aarti entries older than 30 days
    this.cleanOldAarti();
  }

  wipeAllData() {
    localStorage.setItem(KEYS.MEMBERS, JSON.stringify([]));
    localStorage.setItem(KEYS.VARGANI, JSON.stringify([]));
    localStorage.setItem(KEYS.JAMA, JSON.stringify([]));
    localStorage.setItem(KEYS.KHARCH, JSON.stringify([]));
    localStorage.setItem(KEYS.AARTI, JSON.stringify([]));
    localStorage.setItem(KEYS.BANK_FD, JSON.stringify([]));
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

  // Helper to derive fiscal year string (e.g. 2024-25) from date string (YYYY-MM-DD)
  deriveYearFromDate(dateStr) {
    if (!dateStr) return '2026-27';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '2026-27';
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-indexed
    // Fiscal year starts April 1st in India
    if (month >= 4) {
      const nextY = (year + 1).toString().slice(-2);
      return `${year}-${nextY}`;
    } else {
      const prevY = year - 1;
      const curY = year.toString().slice(-2);
      return `${prevY}-${curY}`;
    }
  }

  // Get only available fiscal years present in database + current default years (2024-25, 2025-26, 2026-27)
  getAvailableYears() {
    const yearsSet = new Set(['2024-25', '2025-26', '2026-27']);
    
    const vargani = JSON.parse(localStorage.getItem(KEYS.VARGANI) || '[]');
    const jama = JSON.parse(localStorage.getItem(KEYS.JAMA) || '[]');
    const kharch = JSON.parse(localStorage.getItem(KEYS.KHARCH) || '[]');
    const aarti = JSON.parse(localStorage.getItem(KEYS.AARTI) || '[]');
    const bank = JSON.parse(localStorage.getItem(KEYS.BANK_FD) || '[]');

    vargani.forEach(item => item.year && yearsSet.add(item.year));
    jama.forEach(item => item.year && yearsSet.add(item.year));
    kharch.forEach(item => item.year && yearsSet.add(item.year));
    aarti.forEach(item => item.year && yearsSet.add(item.year));
    bank.forEach(item => item.year && yearsSet.add(item.year));

    // Sort chronologically
    return Array.from(yearsSet).sort();
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
  getMembers(year = null) {
    const vargani = this.getVargani(year);
    const membersMap = new Map();

    vargani.forEach(v => {
      if (v.member_id && v.member_name) {
        membersMap.set(v.member_id, {
          id: v.member_id,
          name: v.member_name,
          phone: v.phone || '',
          status: v.status || 'paid'
        });
      }
    });

    return Array.from(membersMap.values());
  }

  upsertMember(name, phone = '', address = '') {
    const members = JSON.parse(localStorage.getItem(KEYS.MEMBERS) || '[]');
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
    const derivedYear = data.year || this.deriveYearFromDate(data.date);
    const newItem = {
      id: Date.now(),
      status: 'paid', // Default status: paid
      ...data,
      year: derivedYear,
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
      list[idx] = { ...list[idx], ...data };
      localStorage.setItem(KEYS.VARGANI, JSON.stringify(list));
    }
  }

  deleteVargani(id) {
    const list = this.getVargani();
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
    const derivedYear = data.year || this.deriveYearFromDate(data.date);
    const newItem = {
      id: Date.now(),
      ...data,
      year: derivedYear,
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
      list[idx] = { ...list[idx], ...data };
      localStorage.setItem(KEYS.JAMA, JSON.stringify(list));
    }
  }

  deleteJama(id) {
    const list = this.getJama();
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
    const derivedYear = data.year || this.deriveYearFromDate(data.date);
    const newItem = {
      id: Date.now(),
      ...data,
      year: derivedYear,
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
      list[idx] = { ...list[idx], ...data };
      localStorage.setItem(KEYS.KHARCH, JSON.stringify(list));
    }
  }

  deleteKharch(id) {
    const list = this.getKharch();
    const filtered = list.filter(k => k.id !== id);
    localStorage.setItem(KEYS.KHARCH, JSON.stringify(filtered));
  }

  // ── BANK FD & TREASURY ───────────────────────────────────────────────────
  getBankFD(year = null) {
    const list = JSON.parse(localStorage.getItem(KEYS.BANK_FD) || '[]');
    if (year) return list.filter(f => f.year === year);
    return list;
  }

  addBankFD(data) {
    const list = JSON.parse(localStorage.getItem(KEYS.BANK_FD) || '[]');
    const derivedYear = data.year || this.deriveYearFromDate(data.date);

    const newItem = {
      id: Date.now(),
      ...data,
      year: derivedYear,
      created_at: new Date().toISOString()
    };
    list.unshift(newItem);
    localStorage.setItem(KEYS.BANK_FD, JSON.stringify(list));

    if (data.type === 'fd_expense') {
      this.addKharch({
        title: `[FD Withdrawal Expense] ${data.title}`,
        category: 'Miscellaneous Expenses',
        year: derivedYear,
        amount: Number(data.amount),
        date: data.date,
        note: `Auto-recorded from Bank FD withdrawal for expense: ${data.note || ''}`.trim()
      });
    }

    return newItem;
  }

  updateBankFD(id, data) {
    const list = JSON.parse(localStorage.getItem(KEYS.BANK_FD) || '[]');
    const idx = list.findIndex(f => f.id === id);
    if (idx !== -1) {
      const derivedYear = data.year || this.deriveYearFromDate(data.date);
      list[idx] = { ...list[idx], ...data, year: derivedYear };
      localStorage.setItem(KEYS.BANK_FD, JSON.stringify(list));
    }
  }

  deleteBankFD(id) {
    const list = JSON.parse(localStorage.getItem(KEYS.BANK_FD) || '[]');
    const filtered = list.filter(f => f.id !== id);
    localStorage.setItem(KEYS.BANK_FD, JSON.stringify(filtered));
  }

  getBankFDSummary() {
    const list = this.getBankFD();
    let totalFD = 0;
    let totalInterest = 0;
    let totalCharges = 0;
    let totalWithdrawals = 0;
    let totalFDExpenses = 0;
    let expectedReturns = 0;
    let expiredCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    list.forEach(item => {
      const amt = Number(item.amount) || 0;
      if (item.type === 'deposit' || item.type === 'renew') {
        totalFD += amt;
        if (item.expected_returns) expectedReturns += Number(item.expected_returns);
      }
      else if (item.type === 'interest') {
        totalFD += amt;
        totalInterest += amt;
      }
      else if (item.type === 'withdrawal') {
        totalFD -= amt;
        totalWithdrawals += amt;
      }
      else if (item.type === 'fd_expense') {
        totalFD -= amt;
        totalFDExpenses += amt;
      }
      else if (item.type === 'charge') {
        totalFD -= amt;
        totalCharges += amt;
      }

      if (item.expiry_date && item.expiry_date <= todayStr && (item.type === 'deposit' || item.type === 'renew')) {
        expiredCount++;
      }
    });

    return {
      current_fd_balance: Math.max(0, totalFD),
      total_interest: totalInterest,
      total_charges: totalCharges,
      total_withdrawals: totalWithdrawals,
      total_fd_expenses: totalFDExpenses,
      expected_returns: expectedReturns,
      expired_count: expiredCount,
      entries_count: list.length
    };
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
    const derivedYear = data.year || this.deriveYearFromDate(data.date);
    const newItem = {
      id: Date.now(),
      ...data,
      year: derivedYear,
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
      const derivedYear = data.year || this.deriveYearFromDate(data.date);
      list[idx] = { ...list[idx], ...data, year: derivedYear };
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
    const varganiList = this.getVargani(year);
    const vargani = varganiList.reduce((sum, v) => sum + Number(v.amount), 0);
    const jama = this.getJama(year).reduce((sum, j) => sum + Number(j.amount), 0);
    const kharch = this.getKharch(year).reduce((sum, k) => sum + Number(k.amount), 0);
    const income = vargani + jama;
    const balance = income - kharch;

    const paidVarganiList = varganiList.filter(v => (v.status || 'paid') === 'paid');
    const pendingVarganiList = varganiList.filter(v => v.status === 'pending');

    const membersCount = this.getMembers(year).length;
    const paidMembersCount = new Set(paidVarganiList.map(v => v.member_name)).size;
    const pendingMembersCount = new Set(pendingVarganiList.map(v => v.member_name)).size;

    const fdSummary = this.getBankFDSummary();

    return {
      vargani,
      jama,
      kharch,
      income,
      balance,
      membersCount,
      paidMembersCount,
      pendingMembersCount,
      paidVarganiCount: paidVarganiList.length,
      pendingVarganiCount: pendingVarganiList.length,
      bank_fd_balance: fdSummary.current_fd_balance,
      total_assets: balance + fdSummary.current_fd_balance
    };
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
      aarti: this.getAarti(),
      bank_fd: this.getBankFD()
    };
  }

  importJSON(data) {
    if (!data) return;
    if (data.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
    if (data.members) localStorage.setItem(KEYS.MEMBERS, JSON.stringify(data.members));
    if (data.vargani) localStorage.setItem(KEYS.VARGANI, JSON.stringify(data.vargani));
    if (data.jama) localStorage.setItem(KEYS.JAMA, JSON.stringify(data.jama));
    if (data.kharch) localStorage.setItem(KEYS.KHARCH, JSON.stringify(data.kharch));
    if (data.aarti) localStorage.setItem(KEYS.AARTI, JSON.stringify(data.aarti));
    if (data.bank_fd) localStorage.setItem(KEYS.BANK_FD, JSON.stringify(data.bank_fd));
  }
}

export const db = new DBService();
