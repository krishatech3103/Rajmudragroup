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

export const BANK_TRANSFER_TYPES = Object.freeze([
  'cash_to_upi',
  'upi_to_cash',
  'cash_to_bank',
  'upi_to_bank',
  'bank_to_cash',
  'bank_to_upi'
]);

export const isBankTransferType = (type) => BANK_TRANSFER_TYPES.includes(type);

/**
 * Splits recorded income by payment mode. UPI and Online modes are grouped as
 * digital collections; legacy records with no mode are treated as Cash.
 */
export function calculatePaymentModeTotals(records, { excludePending = false } = {}) {
  return asArray(records).reduce((totals, record) => {
    if (excludePending && record?.status === 'pending') return totals;

    const amount = toAmount(record?.amount);
    const mode = String(record?.payment_mode || 'Cash').trim().toLocaleLowerCase();
    if (mode === 'cash') totals.cash += amount;
    else totals.online += amount;
    return totals;
  }, { cash: 0, online: 0 });
}

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
  let totalBankIncome = 0;
  let totalBankExpenses = 0;
  let expectedReturns = 0;
  let expiredCount = 0;

  const todayStr = today instanceof Date && !Number.isNaN(today.getTime())
    ? today.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  // A renewal replaces its selected old FD with the renewed total. Excluding
  // the old source prevents its principal from being counted a second time.
  const renewedSourceIds = new Set(
    asArray(bankFd)
      .filter(item => item?.type === 'renew' && item?.renewed_from_id !== undefined && item.renewed_from_id !== null)
      .map(item => String(item.renewed_from_id))
  );

  asArray(bankFd).forEach((item) => {
    const amount = toAmount(item?.amount);

    if (renewedSourceIds.has(String(item?.id))) return;

    if (item?.type === 'deposit' || item?.type === 'renew' || item?.type === 'cash_to_bank' || item?.type === 'upi_to_bank') {
      totalFD += amount;
      if (item?.type === 'deposit') {
        expectedReturns += toAmount(item.expected_returns);
      }
    } else if (item?.type === 'interest') {
      totalFD += amount;
      totalInterest += amount;
    } else if (item?.type === 'bank_income') {
      totalFD += amount;
      totalBankIncome += amount;
    } else if (item?.type === 'withdrawal' || item?.type === 'bank_to_cash' || item?.type === 'bank_to_upi') {
      totalFD -= amount;
      if (item?.type === 'withdrawal') totalWithdrawals += amount;
    } else if (item?.type === 'fd_expense') {
      totalFD -= amount;
      totalFDExpenses += amount;
    } else if (item?.type === 'charge') {
      totalFD -= amount;
      totalCharges += amount;
    } else if (item?.type === 'bank_expense') {
      totalFD -= amount;
      totalBankExpenses += amount;
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
    total_bank_income: totalBankIncome,
    total_bank_expenses: totalBankExpenses,
    expected_returns: expectedReturns,
    expired_count: expiredCount,
    entries_count: asArray(bankFd).length
  };
}

/**
 * Calculates the amount currently held in Cash and UPI for one festival year.
 * Transfers move money between funds; they are not income or expenses.
 */
export function calculateTreasuryBalances(year, data = {}) {
  const balances = { cash: 0, online: 0 };
  const addByPaymentMode = (record, multiplier) => {
    const amount = toAmount(record?.amount) * multiplier;
    const mode = String(record?.payment_mode || 'Cash').trim().toLocaleLowerCase();
    if (mode === 'cash') balances.cash += amount;
    else balances.online += amount;
  };

  recordsForYear(data?.vargani, year)
    .filter(record => (record?.status || 'paid') === 'paid')
    .forEach(record => addByPaymentMode(record, 1));
  recordsForYear(data?.jama, year).forEach(record => addByPaymentMode(record, 1));
  recordsForYear(data?.kharch, year).forEach(record => addByPaymentMode(record, -1));

  recordsForYear(data?.bank_fd, year).forEach(record => {
    const amount = toAmount(record?.amount);
    switch (record?.type) {
      case 'cash_to_upi':
        balances.cash -= amount;
        balances.online += amount;
        break;
      case 'upi_to_cash':
        balances.online -= amount;
        balances.cash += amount;
        break;
      case 'cash_to_bank':
        balances.cash -= amount;
        break;
      case 'upi_to_bank':
        balances.online -= amount;
        break;
      case 'bank_to_cash':
        balances.cash += amount;
        break;
      case 'bank_to_upi':
        balances.online += amount;
        break;
      default:
        break;
    }
  });

  return balances;
}

/**
 * Calculates the financial and member summary for a fiscal year from a
 * Supabase-shaped data object.
 */
export function calculateSummary(year, data = {}) {
  const varganiList = recordsForYear(data?.vargani, year);
  const jamaList = recordsForYear(data?.jama, year);
  const kharchList = recordsForYear(data?.kharch, year);

  // A pending promise is not money available to the Mandal. Only paid
  // donations belong in the yearly income and deficit/surplus calculation.
  const paidVarganiList = varganiList.filter((record) => (record?.status || 'paid') === 'paid');
  const pendingVarganiList = varganiList.filter((record) => record?.status === 'pending');
  const vargani = paidVarganiList.reduce((sum, record) => sum + toAmount(record?.amount), 0);
  const jama = jamaList.reduce((sum, record) => sum + toAmount(record?.amount), 0);
  const kharch = kharchList.reduce((sum, record) => sum + toAmount(record?.amount), 0);
  const income = vargani + jama;
  const balance = income - kharch;

  // A member is active for a festival year only when they have a donation row
  // in that year. This excludes historical/orphan member rows from the live
  // dashboard, including members whose only receipt was deleted.
  const activeMemberKeys = new Set(varganiList.map(memberKey).filter(Boolean));
  const membersCount = activeMemberKeys.size;
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
    bank_fd_balance: fdSummary.current_fd_balance
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
