/**
 * Pure ledger calculations shared by the dashboard, reports, and PDF export.
 *
 * These helpers deliberately operate only on the data passed to them. Keeping
 * the calculations here prevents display code from reading browser storage and
 * makes the same Supabase response render consistently across the app.
 */

const DEFAULT_FISCAL_YEAR = '2026-27';

const asArray = (value) => (Array.isArray(value) ? value : []);

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const recordsForYear = (records, year) => {
  const list = asArray(records);
  return year ? list.filter((record) => record?.year === year) : list;
};

const memberKey = (record) => {
  if (record?.member_id !== undefined && record.member_id !== null && record.member_id !== '') {
    return `id:${record.member_id}`;
  }

  if (record?.member_name) return `name:${record.member_name}`;
  return null;
};

/**
 * Returns the Indian fiscal year for a date. The fiscal year begins on April 1.
 */
export function deriveYearFromDate(dateValue, fallbackYear = DEFAULT_FISCAL_YEAR) {
  if (!dateValue) return fallbackYear;

  // Parse database DATE values directly so a user's timezone cannot move a
  // YYYY-MM-DD date into a neighbouring fiscal year.
  if (typeof dateValue === 'string') {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateValue);
    if (dateMatch) {
      const year = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);

      if (Number.isInteger(year) && month >= 1 && month <= 12) {
        return month >= 4
          ? `${year}-${String(year + 1).slice(-2)}`
          : `${year - 1}-${String(year).slice(-2)}`;
      }
    }
  }

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return fallbackYear;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 4
    ? `${year}-${String(year + 1).slice(-2)}`
    : `${year - 1}-${String(year).slice(-2)}`;
}

/**
 * Calculates the all-time FD balance and related totals from bank FD rows.
 */
export function calculateBankFDSummary(bankFd, today = new Date()) {
  let totalFD = 0;
  let totalInterest = 0;
  let totalCharges = 0;
  let totalWithdrawals = 0;
  let totalFDExpenses = 0;
  let expectedReturns = 0;
  let expiredCount = 0;

  const todayStr = today instanceof Date && !Number.isNaN(today.getTime())
    ? today.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  asArray(bankFd).forEach((item) => {
    const amount = toAmount(item?.amount);

    if (item?.type === 'deposit' || item?.type === 'renew') {
      totalFD += amount;
      expectedReturns += toAmount(item.expected_returns);
    } else if (item?.type === 'interest') {
      totalFD += amount;
      totalInterest += amount;
    } else if (item?.type === 'withdrawal') {
      totalFD -= amount;
      totalWithdrawals += amount;
    } else if (item?.type === 'fd_expense') {
      totalFD -= amount;
      totalFDExpenses += amount;
    } else if (item?.type === 'charge') {
      totalFD -= amount;
      totalCharges += amount;
    }

    if (
      item?.expiry_date &&
      String(item.expiry_date).slice(0, 10) <= todayStr &&
      (item.type === 'deposit' || item.type === 'renew')
    ) {
      expiredCount += 1;
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
    entries_count: asArray(bankFd).length
  };
}

/**
 * Calculates the financial and member summary for a fiscal year from a
 * Supabase-shaped data object.
 */
export function calculateSummary(year, data = {}) {
  const varganiList = recordsForYear(data?.vargani, year);
  const jamaList = recordsForYear(data?.jama, year);
  const kharchList = recordsForYear(data?.kharch, year);

  const vargani = varganiList.reduce((sum, record) => sum + toAmount(record?.amount), 0);
  const jama = jamaList.reduce((sum, record) => sum + toAmount(record?.amount), 0);
  const kharch = kharchList.reduce((sum, record) => sum + toAmount(record?.amount), 0);
  const income = vargani + jama;
  const balance = income - kharch;

  const paidVarganiList = varganiList.filter((record) => (record?.status || 'paid') === 'paid');
  const pendingVarganiList = varganiList.filter((record) => record?.status === 'pending');
  const registeredMembers = asArray(data?.members);

  // Member rows are now supplied by Supabase. For legacy/incomplete imports,
  // still show donation-linked members instead of an empty dashboard.
  const fallbackMembers = new Set(varganiList.map(memberKey).filter(Boolean));
  const membersCount = registeredMembers.length || fallbackMembers.size;
  const paidMembersCount = new Set(paidVarganiList.map(memberKey).filter(Boolean)).size;
  const pendingMembersCount = new Set(pendingVarganiList.map(memberKey).filter(Boolean)).size;
  const fdSummary = calculateBankFDSummary(data?.bank_fd);

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

/**
 * Groups a fiscal year's expenses by category for display and reporting.
 */
export function getKharchByCategory(year, kharch) {
  const totals = new Map();

  recordsForYear(kharch, year).forEach((record) => {
    const category = record?.category || 'Uncategorized';
    totals.set(category, (totals.get(category) || 0) + toAmount(record?.amount));
  });

  return Array.from(totals, ([category, total]) => ({ category, total }));
}
