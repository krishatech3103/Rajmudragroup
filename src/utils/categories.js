export const MEMBER_DONATION_CATEGORY = 'Member Donation (वर्गणी)';

export const DEFAULT_INCOME_CATEGORIES = Object.freeze([
  'Sponsorship / Awards',
  'Stall / Banner Rental',
  'Cultural Program Fund',
  'Interest Income',
  'Other Income'
]);

export const DEFAULT_EXPENSE_CATEGORIES = Object.freeze([
  'Mandap & Decoration',
  'Lighting & Illumination',
  'Sound System & DJ',
  'Pooja & Prasadam',
  'Band & Dhol-Tasha',
  'Visarjan Procession',
  'Annadaan / Feast',
  'Security & Police',
  'Transportation',
  'Miscellaneous Expenses',
  'Other Expense'
]);

function normaliseCategories(value, fallback) {
  if (!Array.isArray(value)) return [...fallback];

  const seen = new Set();
  const categories = value
    .map(category => String(category || '').trim())
    .filter(Boolean)
    .filter(category => {
      const key = category.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return categories.length ? categories : [...fallback];
}

export function getIncomeCategories(settings = {}) {
  return normaliseCategories(settings.income_categories, DEFAULT_INCOME_CATEGORIES);
}

export function getExpenseCategories(settings = {}) {
  return normaliseCategories(settings.expense_categories, DEFAULT_EXPENSE_CATEGORIES);
}
