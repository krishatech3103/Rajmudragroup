export const AARTI_DAY_COUNT = 9;

const MARATHI_WEEKDAYS = Object.freeze([
  'रविवार',
  'सोमवार',
  'मंगळवार',
  'बुधवार',
  'गुरुवार',
  'शुक्रवार',
  'शनिवार'
]);

export function isISOCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;

  const [year, month, day] = String(value).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function addDaysToISODate(value, days) {
  if (!isISOCalendarDate(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + Number(days || 0)));
  return date.toISOString().slice(0, 10);
}

export function formatAartiDate(value) {
  if (!isISOCalendarDate(value)) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function getMarathiWeekday(value) {
  if (!isISOCalendarDate(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  return MARATHI_WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

export function getAartiStartDate(settings = {}, year = '') {
  const datesByYear = settings?.aarti_start_dates;
  const configuredDate = datesByYear && typeof datesByYear === 'object' && !Array.isArray(datesByYear)
    ? datesByYear[year]
    : '';

  if (isISOCalendarDate(configuredDate)) return configuredDate;

  // Support the first version of this setting if an installation already saved it.
  if (settings?.active_year === year && isISOCalendarDate(settings?.aarti_start_date)) {
    return settings.aarti_start_date;
  }

  return '';
}

export function getAartiDateRange(startDate) {
  if (!isISOCalendarDate(startDate)) return [];

  return Array.from({ length: AARTI_DAY_COUNT }, (_, index) => {
    const date = addDaysToISODate(startDate, index);
    return {
      dayNumber: index + 1,
      date,
      formattedDate: formatAartiDate(date),
      weekday: getMarathiWeekday(date)
    };
  });
}

export function buildAartiSchedule(year, records = [], startDate = '') {
  const recordsByDate = new Map();

  (Array.isArray(records) ? records : [])
    .filter(record => record?.year === year && isISOCalendarDate(record?.date))
    .sort((left, right) => String(left.updated_at || left.id || '').localeCompare(String(right.updated_at || right.id || '')))
    .forEach(record => recordsByDate.set(record.date, record));

  return getAartiDateRange(startDate).map(day => ({
    ...day,
    record: recordsByDate.get(day.date) || null
  }));
}
