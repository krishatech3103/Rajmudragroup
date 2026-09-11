import html2pdf from 'html2pdf.js';
import { calculateBankFDSummary, calculateSummary, getKharchByCategory, isBankTransferType } from './ledger';
import { buildAartiSchedule, formatAartiDate, getAartiDefaultTimes, isISOCalendarDate } from './aartiSchedule';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

export function generatePDFReport(year, data = {}, scope = 'all') {
  const ledgerData = data || {};
  const selectedScope = ['all', 'income', 'expense'].includes(scope) ? scope : 'all';
  const includeIncome = selectedScope !== 'expense';
  const includeExpenses = selectedScope !== 'income';
  const summary = calculateSummary(year, ledgerData);
  const vargani = (Array.isArray(ledgerData.vargani) ? ledgerData.vargani : [])
    .filter(record => !year || record?.year === year);
  const jama = (Array.isArray(ledgerData.jama) ? ledgerData.jama : [])
    .filter(record => !year || record?.year === year);
  const kharch = (Array.isArray(ledgerData.kharch) ? ledgerData.kharch : [])
    .filter(record => !year || record?.year === year);
  const kharchCats = getKharchByCategory(year, ledgerData.kharch);

  const element = document.createElement('div');
  element.style.width = '190mm';
  element.style.padding = '6mm';
  element.style.boxSizing = 'border-box';
  element.style.fontFamily = "'Noto Sans Devanagari', 'Outfit', sans-serif";
  element.style.color = '#0F172A';
  element.style.background = '#ffffff';

  const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  const safeYear = escapeHtml(year);
  const now = new Date();
  const dateStr = now.toLocaleDateString('mr-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' });
  const safeBlock = 'page-break-inside:avoid; break-inside:avoid;';
  const scopeLabel = selectedScope === 'income' ? 'Income Only' : selectedScope === 'expense' ? 'Expense Only' : 'All Financial Records';

  const summaryRows = selectedScope === 'income'
    ? `
      <tr><td style="padding:9px; border:1px solid #E2E8F0;">Member Donations (paid)</td><td style="padding:9px; border:1px solid #E2E8F0; text-align:right; font-weight:700;">${fmt(summary.vargani)}</td></tr>
      <tr><td style="padding:9px; border:1px solid #E2E8F0;">Other Income</td><td style="padding:9px; border:1px solid #E2E8F0; text-align:right; font-weight:700;">${fmt(summary.jama)}</td></tr>
      <tr style="background:#ECFDF5;"><td style="padding:10px; border:1px solid #A7F3D0; color:#065F46; font-weight:800;">Total Income</td><td style="padding:10px; border:1px solid #A7F3D0; text-align:right; color:#065F46; font-weight:900; font-size:15px;">${fmt(summary.income)}</td></tr>
    `
    : selectedScope === 'expense'
      ? `<tr style="background:#FEF2F2;"><td style="padding:10px; border:1px solid #FCA5A5; color:#991B1B; font-weight:800;">Total Expenses</td><td style="padding:10px; border:1px solid #FCA5A5; text-align:right; color:#991B1B; font-weight:900; font-size:15px;">${fmt(summary.kharch)}</td></tr>`
      : `
        <tr><td style="padding:9px; border:1px solid #E2E8F0;">एकूण सभासद वर्गणी (Member Donations)</td><td style="padding:9px; border:1px solid #E2E8F0; text-align:right; font-weight:700;">${fmt(summary.vargani)}</td></tr>
        <tr><td style="padding:9px; border:1px solid #E2E8F0;">इतर जमा व जाहिरात उत्पन्न (Other Income)</td><td style="padding:9px; border:1px solid #E2E8F0; text-align:right; font-weight:700;">${fmt(summary.jama)}</td></tr>
        <tr style="background:#ECFDF5;"><td style="padding:10px; border:1px solid #A7F3D0; color:#065F46; font-weight:800;">सर्व एकूण जमा रक्कम (Total Revenue)</td><td style="padding:10px; border:1px solid #A7F3D0; text-align:right; color:#065F46; font-weight:900; font-size:15px;">${fmt(summary.income)}</td></tr>
        <tr style="background:#FEF2F2;"><td style="padding:10px; border:1px solid #FCA5A5; color:#991B1B; font-weight:800;">सर्व एकूण झालेला खर्च (Total Expenses)</td><td style="padding:10px; border:1px solid #FCA5A5; text-align:right; color:#991B1B; font-weight:900; font-size:15px;">${fmt(summary.kharch)}</td></tr>
        <tr style="background:#FFFBEB;"><td style="padding:11px; border:1px solid #FDE68A; color:#92400E; font-weight:900;">अंतिम शिलक रक्कम (Net Balance / Surplus)</td><td style="padding:11px; border:1px solid #FDE68A; text-align:right; color:#92400E; font-weight:900; font-size:16px;">${fmt(summary.balance)}</td></tr>
      `;

  const donationPageSize = 20;
  const donationPages = [];
  for (let start = 0; start < vargani.length; start += donationPageSize) {
    donationPages.push(vargani.slice(start, start + donationPageSize));
  }
  if (donationPages.length === 0) donationPages.push([]);

  const donationTables = donationPages.map((pageRows, pageIndex) => {
    const rows = pageRows.length === 0
      ? '<tr><td colspan="5" style="padding:12px; text-align:center; color:#64748B; border:1px solid #E2E8F0;">वर्गणीची नोंद उपलब्ध नाही.</td></tr>'
      : pageRows.map((v, rowIndex) => {
        const isPaid = (v.status || 'paid') === 'paid';
        return `<tr style="${safeBlock}">
          <td style="padding:6px 4px; border:1px solid #E2E8F0; text-align:center; width:6%;">${pageIndex * donationPageSize + rowIndex + 1}</td>
          <td style="padding:6px 4px; border:1px solid #E2E8F0; width:15%;">${escapeHtml(new Date(v.date).toLocaleDateString('mr-IN'))}</td>
          <td style="padding:6px 4px; border:1px solid #E2E8F0; font-weight:700; width:49%;">${escapeHtml(v.member_name)}</td>
          <td style="padding:6px 3px; border:1px solid #E2E8F0; width:10%; max-width:10%; overflow-wrap:anywhere;">${escapeHtml(v.receipt_no || '-')}</td>
          <td style="padding:6px 4px; border:1px solid #E2E8F0; text-align:right; color:${isPaid ? '#1D4ED8' : '#B45309'}; font-weight:800; white-space:nowrap; width:20%;">${isPaid ? '✔️' : '❌'} ${fmt(v.amount)}</td>
        </tr>`;
      }).join('');

    return `<div style="${safeBlock} page-break-before:always; margin-bottom:18px;">
      <table style="width:100%; border-collapse:collapse; font-size:10px; table-layout:fixed; page-break-inside:avoid;">
        <thead><tr style="background:#EFF6FF; color:#1E40AF;">
          <th style="padding:6px 4px; border:1px solid #BFDBFE; width:6%;">No.</th>
          <th style="padding:6px 4px; border:1px solid #BFDBFE; width:15%;">Date</th>
          <th style="padding:6px 4px; border:1px solid #BFDBFE; width:49%; text-align:left;">Member</th>
          <th style="padding:6px 3px; border:1px solid #BFDBFE; width:10%;">Receipt</th>
          <th style="padding:6px 4px; border:1px solid #BFDBFE; width:20%; text-align:right;">Amount</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('');

  const otherIncomeRows = jama.length === 0
    ? '<tr><td colspan="5" style="padding:12px; text-align:center; color:#64748B; border:1px solid #E2E8F0;">Other income records are not available.</td></tr>'
    : jama.map((item, idx) => `<tr style="${safeBlock}">
        <td style="padding:6px; border:1px solid #E2E8F0; text-align:center;">${idx + 1}</td>
        <td style="padding:6px; border:1px solid #E2E8F0;">${escapeHtml(new Date(item.date).toLocaleDateString('en-IN'))}</td>
        <td style="padding:6px; border:1px solid #E2E8F0; font-weight:700;">${escapeHtml(item.title)}</td>
        <td style="padding:6px; border:1px solid #E2E8F0;">${escapeHtml(item.category)}</td>
        <td style="padding:6px; border:1px solid #E2E8F0; text-align:right; color:#047857; font-weight:800;">${fmt(item.amount)}</td>
      </tr>`).join('');

  const expenseRows = kharch.length === 0
    ? '<tr><td colspan="5" style="padding:12px; text-align:center; color:#64748B; border:1px solid #E2E8F0;">No expense records are available.</td></tr>'
    : kharch.map((item, idx) => `<tr style="${safeBlock}">
        <td style="padding:6px; border:1px solid #E2E8F0; text-align:center;">${idx + 1}</td>
        <td style="padding:6px; border:1px solid #E2E8F0;">${escapeHtml(new Date(item.date).toLocaleDateString('en-IN'))}</td>
        <td style="padding:6px; border:1px solid #E2E8F0; font-weight:700;">${escapeHtml(item.title)}</td>
        <td style="padding:6px; border:1px solid #E2E8F0;">${escapeHtml(item.category)}</td>
        <td style="padding:6px; border:1px solid #E2E8F0; text-align:right; color:#DC2626; font-weight:800;">${fmt(item.amount)}</td>
      </tr>`).join('');

  const expenseCategorySection = kharchCats.length === 0 ? '' : `
    <div style="${safeBlock} margin-bottom:18px;">
      <h3 style="color:#9A2A2A; font-size:15px; font-weight:900; border-bottom:2px solid #D84315; padding-bottom:6px; margin:0 0 10px;">Expense Categories</h3>
      <table style="width:100%; border-collapse:collapse; font-size:11px; page-break-inside:auto;">
        <thead><tr style="background:#FEF2F2; color:#991B1B;"><th style="padding:7px; border:1px solid #FCA5A5; text-align:left;">Category</th><th style="padding:7px; border:1px solid #FCA5A5; text-align:right;">Total</th></tr></thead>
        <tbody>${kharchCats.map(c => `<tr style="${safeBlock}"><td style="padding:6px; border:1px solid #E2E8F0;">${escapeHtml(c.category)}</td><td style="padding:6px; border:1px solid #E2E8F0; text-align:right; font-weight:800; color:#DC2626;">${fmt(c.total)}</td></tr>`).join('')}</tbody>
      </table>
    </div>`;

  const signatures = selectedScope === 'expense' ? '' : `
    <div style="${safeBlock} margin-top:28px; padding-top:16px; border-top:1px dashed #CBD5E1; display:flex; justify-content:space-between; text-align:center; font-size:11px; color:#334155;">
      <div><div style="height:28px;"></div><p style="margin:0; font-weight:800;">( ____________ )</p><p style="margin:3px 0 0; font-weight:900; color:#9A2A2A;">अध्यक्ष</p></div>
      <div><div style="height:28px;"></div><p style="margin:0; font-weight:800;">( ____________ )</p><p style="margin:3px 0 0; font-weight:900; color:#9A2A2A;">सचिव</p></div>
      <div><div style="height:28px;"></div><p style="margin:0; font-weight:800;">( ____________ )</p><p style="margin:3px 0 0; font-weight:900; color:#9A2A2A;">खजिनदार</p></div>
    </div>`;

  element.innerHTML = `
    <div style="${safeBlock} border:3px double #D84315; border-radius:14px; padding:15px; text-align:center; background:linear-gradient(135deg,#FFF5ED 0%,#FFE0B2 100%); margin-bottom:17px;">
      <h3 style="margin:0; color:#D84315; font-size:14px; font-weight:800;">॥ श्री गणेशाय नमः ॥</h3>
      <h1 style="margin:5px 0; color:#9A2A2A; font-size:22px; font-weight:900;">राजमुद्रा गणेश व नवरात्र उत्सव मंडळ</h1>
      <h2 style="margin:3px 0 0; color:#2D3748; font-size:14px; font-weight:800;">वार्षिक जमा-खर्च व हिशोब पत्रक (उत्सव वर्ष: ${safeYear})</h2>
      <div style="margin-top:7px; font-size:10px; color:#4A5568; font-weight:700;">${escapeHtml(scopeLabel)} • अहवाल निर्मिती: ${escapeHtml(dateStr)} ${escapeHtml(timeStr)}</div>
    </div>

    <div style="${safeBlock} margin-bottom:18px;">
      <h3 style="color:#9A2A2A; font-size:14px; font-weight:900; border-bottom:2px solid #D84315; padding-bottom:5px; margin:0 0 9px;">Financial Summary</h3>
      <table style="width:100%; border-collapse:collapse; font-size:11px;"><thead><tr style="background:#E2E8F0;"><th style="padding:7px; border:1px solid #CBD5E1; text-align:left;">Account Head</th><th style="padding:7px; border:1px solid #CBD5E1; text-align:right;">Amount</th></tr></thead><tbody>${summaryRows}</tbody></table>
    </div>

    ${includeIncome ? `
      <div style="margin-bottom:18px;">
        <h3 style="${safeBlock} color:#1D4ED8; font-size:14px; font-weight:900; border-bottom:2px solid #2563EB; padding-bottom:5px; margin:0 0 9px;">Member Donations (${vargani.length} records)</h3>
        ${donationTables}
      </div>
      <div style="margin-bottom:18px;">
        <h3 style="color:#047857; font-size:14px; font-weight:900; border-bottom:2px solid #059669; padding-bottom:5px; margin:0 0 9px;">Other Income (${jama.length} records)</h3>
        <table style="width:100%; border-collapse:collapse; font-size:10px; page-break-inside:auto;"><thead><tr style="background:#ECFDF5; color:#065F46;"><th style="padding:6px; border:1px solid #A7F3D0; width:28px;">No.</th><th style="padding:6px; border:1px solid #A7F3D0;">Date</th><th style="padding:6px; border:1px solid #A7F3D0;">Title</th><th style="padding:6px; border:1px solid #A7F3D0;">Category</th><th style="padding:6px; border:1px solid #A7F3D0; text-align:right;">Amount</th></tr></thead><tbody>${otherIncomeRows}</tbody></table>
      </div>
    ` : ''}

    ${includeExpenses ? `
      ${expenseCategorySection}
      <div style="margin-bottom:18px;">
        <h3 style="color:#991B1B; font-size:14px; font-weight:900; border-bottom:2px solid #DC2626; padding-bottom:5px; margin:0 0 9px;">Expenses (${kharch.length} records)</h3>
        <table style="width:100%; border-collapse:collapse; font-size:10px; page-break-inside:auto;"><thead><tr style="background:#FEF2F2; color:#991B1B;"><th style="padding:6px; border:1px solid #FCA5A5; width:28px;">No.</th><th style="padding:6px; border:1px solid #FCA5A5;">Date</th><th style="padding:6px; border:1px solid #FCA5A5;">Title</th><th style="padding:6px; border:1px solid #FCA5A5;">Category</th><th style="padding:6px; border:1px solid #FCA5A5; text-align:right;">Amount</th></tr></thead><tbody>${expenseRows}</tbody></table>
      </div>
    ` : ''}
    ${signatures}
  `;

  html2pdf().set({
    margin: [8, 8, 8, 8],
    filename: `Rajmudra_Mandal_Ahaval_${String(year).replace(/[^a-z0-9-]/gi, '_')}_${selectedScope}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    pagebreak: { mode: ['css', 'legacy'], avoid: ['tr'] },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(element).save();
}

const formatDate = (value, locale = 'en-IN') => value
  ? new Date(value).toLocaleDateString(locale)
  : '-';

export function createAartiSchedulePDFElement(year, records = [], startDate = '', settings = {}) {
  if (!isISOCalendarDate(startDate)) {
    throw new Error('Set the Aarti schedule start date in Settings before exporting the PDF.');
  }

  const schedule = buildAartiSchedule(year, records, startDate);
  const aartiDefaultTimes = getAartiDefaultTimes(settings);
  const formatAartiTime = (value) => String(value || '')
    .trim()
    .replace(/^(सकाळी|सायंकाळी|संध्याकाळी|रात्री)\s*[-:]?\s*/u, '')
    .replace(/\s*(AM|PM)\s*$/i, '')
    .replace(/(\d)\.(\d)/g, '$1 : $2')
    .trim();
  const renderSessionTime = (label, value, defaultTime) => {
    const time = formatAartiTime(value) || formatAartiTime(defaultTime);
    return `${label} - ${escapeHtml(time)}`;
  };
  const renderName = (host, note = '') => {
    const safeHost = String(host || '').trim();
    const safeNote = String(note || '').trim();
    if (!safeHost && !safeNote) return '&nbsp;';
    return `${safeHost ? `<span>${escapeHtml(safeHost)}</span>` : ''}${safeNote ? `<span style="${safeHost ? 'display:block; margin-top:1mm;' : ''} font-size:9.8px;">${escapeHtml(safeNote)}</span>` : ''}`;
  };
  const element = document.createElement('div');
  // html2pdf leaves 6mm on each side of A4, so this exactly fills the remaining
  // printable area and prevents the application's dark page background showing.
  element.style.width = '198mm';
  element.style.minHeight = '285mm';
  element.style.padding = '3mm';
  element.style.boxSizing = 'border-box';
  element.style.display = 'flex';
  element.style.flexDirection = 'column';
  element.style.border = '1.2px solid #000000';
  element.style.fontFamily = "'Noto Sans Devanagari', 'Outfit', sans-serif";
  element.style.color = '#111111';
  element.style.background = '#ffffff';

  element.innerHTML = `
    <div style="page-break-inside:avoid; break-inside:avoid; text-align:center; margin-bottom:3mm;">
      <div style="font-size:12.1px; font-weight:800;">॥ श्री गणेशाय नमः ॥</div>
      <div style="font-size:22.4px; font-weight:900; margin:0.5mm 0;">राजमुद्रा गणेश व नवरात्र उत्सव मंडळ</div>
      <div style="font-size:12.1px; font-weight:800;">उत्सव वर्ष : ${escapeHtml(year)}</div>
      <div style="display:inline-block; margin-top:1mm; padding:0.8mm 8mm; border-top:1px solid #000000; border-bottom:1px solid #000000; font-size:15.9px; font-weight:900;">आरती वेळापत्रक</div>
    </div>
    <table style="width:100%; border-collapse:collapse; table-layout:fixed; font-size:11.5px;">
      <thead>
        <tr>
          <th style="width:7%; height:9mm; padding:1mm; border:1.2px solid #000000;">अ. क्र.</th>
          <th style="width:17%; height:9mm; padding:1mm; border:1.2px solid #000000;">दिनांक</th>
          <th style="width:18%; height:9mm; padding:1mm; border:1.2px solid #000000;">वेळ</th>
          <th style="width:58%; height:9mm; padding:1mm; border:1.2px solid #000000;">आरतीधारकाचे नाव</th>
        </tr>
      </thead>
    </table>
    ${schedule.map((day, index) => {
      const item = day.record || {};
      return `
        <table class="aarti-day" style="width:100%; margin-top:1.6mm; border-collapse:collapse; table-layout:fixed; font-size:11.5px; page-break-inside:avoid; break-inside:avoid;">
          <tbody>
            <tr>
              <td rowspan="2" style="width:7%; height:20mm; padding:1mm; border:1.2px solid #000000; text-align:center; vertical-align:middle; font-weight:900;">${index + 1}</td>
              <td rowspan="2" style="width:17%; height:20mm; padding:1mm; border:1.2px solid #000000; text-align:center; vertical-align:middle; font-weight:900;">
                ${escapeHtml(formatAartiDate(day.date))}
                <span style="display:block; margin-top:0.5mm; font-size:9.8px;">${escapeHtml(day.weekday)}</span>
              </td>
              <td style="width:18%; height:10mm; padding:0.8mm 1mm; border:1.2px solid #000000; text-align:center; vertical-align:middle; font-weight:800; white-space:nowrap;">${renderSessionTime('सकाळी', item.morning_time, aartiDefaultTimes.morningTime)}</td>
              <td style="width:58%; height:10mm; padding:0.8mm 1.5mm; border:1.2px solid #000000; text-align:center; vertical-align:middle; font-weight:800;">${renderName(item.morning_host)}</td>
            </tr>
            <tr>
              <td style="width:18%; height:10mm; padding:0.8mm 1mm; border:1.2px solid #000000; text-align:center; vertical-align:middle; font-weight:800; white-space:nowrap;">${renderSessionTime('रात्री', item.evening_time, aartiDefaultTimes.eveningTime)}</td>
              <td style="width:58%; height:10mm; padding:0.8mm 1.5mm; border:1.2px solid #000000; text-align:center; vertical-align:middle; font-weight:800;">${renderName(item.evening_host, item.note)}</td>
            </tr>
          </tbody>
        </table>
      `;
    }).join('')}
    <div style="page-break-inside:avoid; break-inside:avoid; margin-top:auto; padding:2.5mm 3mm; border:1.2px solid #000000; text-align:left; font-size:11.3px; line-height:1.55;">
      <div style="font-size:13.2px; font-weight:900; margin-bottom:1mm; text-decoration:underline;">सूचना:-</div>
      <ol style="margin:0; padding-left:5mm;">
        <li>आरती दिलेल्या वेळेत चालू होईल.</li>
        <li>सर्वांनी आरतीसाठी वेळेत उपस्थित राहावे.</li>
        <li>आरतीसाठी येताना प्रसाद असल्यास आणावा, नसल्यास तसे मंडळास कळवावे.</li>
        <li>काही कारणामुळे आरतीस विलंब अथवा इतर कोणतेही कारण असल्यास मंडळास कळवावे.</li>
      </ol>
    </div>
  `;

  return element;
}

export async function generateAartiSchedulePDF(year, records = [], startDate = '', settings = {}) {
  const element = createAartiSchedulePDFElement(year, records, startDate, settings);

  if (document.fonts?.ready) {
    // A blocked web-font request must not leave the Export button spinning forever.
    await Promise.race([
      document.fonts.ready,
      new Promise(resolve => window.setTimeout(resolve, 3000))
    ]);
  }

  return html2pdf().set({
    margin: [6, 6, 6, 6],
    filename: `आरती_वेळापत्रक_${year}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    pagebreak: { mode: ['css', 'legacy'], avoid: ['.aarti-day'] },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(element).save();
}

function bankEntryLabel(type) {
  const labels = {
    deposit: 'FD Deposit', renew: 'FD Renewal', interest: 'Interest Received',
    bank_income: 'Bank Income / Credit', bank_expense: 'Bank Expense / Debit',
    withdrawal: 'FD Withdrawal', fd_expense: 'FD Expense', charge: 'Bank Charge',
    cash_to_upi: 'Cash → UPI Transfer', upi_to_cash: 'UPI → Cash Transfer',
    cash_to_bank: 'Cash → Mandal Bank', upi_to_bank: 'UPI → Mandal Bank',
    bank_to_cash: 'Mandal Bank → Cash', bank_to_upi: 'Mandal Bank → UPI'
  };
  return labels[type] || 'Bank Entry';
}

export function generateBankTreasuryPDF(entries = []) {
  const allEntries = [...(Array.isArray(entries) ? entries : [])]
    .sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')));
  const summary = calculateBankFDSummary(allEntries);
  const element = document.createElement('div');
  element.style.padding = '8mm';
  element.style.fontFamily = "'Noto Sans Devanagari', 'Outfit', sans-serif";
  element.style.color = '#0F172A';
  element.style.background = '#ffffff';

  element.innerHTML = `
    <div style="page-break-inside:avoid; break-inside:avoid; display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2px solid #047857; padding-bottom:4mm; margin-bottom:4mm;">
      <div><div style="font-size:17px; font-weight:900; color:#065F46;">Rajmudra Mandal Bank & Treasury</div><div style="font-size:10px; color:#64748B; font-weight:700;">All-time transaction report — separate from yearly income and expenses</div></div>
      <div style="text-align:right;"><div style="font-size:9px; color:#64748B;">CURRENT BANK / FD BALANCE</div><div style="font-size:16px; font-weight:900; color:#047857;">₹${Number(summary.current_fd_balance).toLocaleString('en-IN')}</div></div>
    </div>
    <div style="page-break-inside:avoid; break-inside:avoid; display:grid; grid-template-columns:repeat(4,1fr); gap:3mm; margin-bottom:4mm; font-size:9px;">
      <div style="background:#EFF6FF; padding:3mm; border-radius:3mm;"><b>Interest</b><br>₹${Number(summary.total_interest).toLocaleString('en-IN')}</div>
      <div style="background:#FEF2F2; padding:3mm; border-radius:3mm;"><b>Withdrawals</b><br>₹${Number(summary.total_withdrawals).toLocaleString('en-IN')}</div>
      <div style="background:#FFF7ED; padding:3mm; border-radius:3mm;"><b>Charges</b><br>₹${Number(summary.total_charges).toLocaleString('en-IN')}</div>
      <div style="background:#ECFDF5; padding:3mm; border-radius:3mm;"><b>Entries</b><br>${allEntries.length}</div>
    </div>
    <table style="width:100%; border-collapse:collapse; font-size:8px;">
      <thead><tr style="background:#ECFDF5; color:#065F46;"><th style="padding:5px; border:1px solid #A7F3D0;">Date</th><th style="padding:5px; border:1px solid #A7F3D0;">Year</th><th style="padding:5px; border:1px solid #A7F3D0;">Type</th><th style="padding:5px; border:1px solid #A7F3D0;">Description / Bank</th><th style="padding:5px; border:1px solid #A7F3D0; text-align:right;">Amount</th></tr></thead>
      <tbody>
        ${allEntries.length ? allEntries.map((item, index) => {
          const outgoing = ['withdrawal', 'fd_expense', 'charge', 'bank_expense', 'bank_to_cash', 'bank_to_upi'].includes(item.type);
          const transfer = isBankTransferType(item.type);
          return `<tr style="page-break-inside:avoid; break-inside:avoid; background:${index % 2 ? '#F8FAFC' : '#FFFFFF'};"><td style="padding:5px; border:1px solid #E2E8F0;">${escapeHtml(formatDate(item.date))}</td><td style="padding:5px; border:1px solid #E2E8F0;">${escapeHtml(item.year || '-')}</td><td style="padding:5px; border:1px solid #E2E8F0;">${escapeHtml(bankEntryLabel(item.type))}</td><td style="padding:5px; border:1px solid #E2E8F0;"><b>${escapeHtml(item.title)}</b>${item.bank_name ? ` • ${escapeHtml(item.bank_name)}` : ''}${item.holder_name ? `<br><span style="color:#334155; font-weight:700;">Held by: ${escapeHtml(item.holder_name)}</span>` : ''}${item.note ? `<br><span style="color:#64748B;">${escapeHtml(item.note)}</span>` : ''}</td><td style="padding:5px; border:1px solid #E2E8F0; text-align:right; font-weight:800; color:${outgoing ? '#DC2626' : transfer ? '#2563EB' : '#047857'};">${transfer ? '↔' : outgoing ? '-' : '+'} ₹${Number(item.amount).toLocaleString('en-IN')}</td></tr>`;
        }).join('') : '<tr><td colspan="5" style="padding:15px; border:1px solid #E2E8F0; text-align:center;">No bank or treasury entries.</td></tr>'}
      </tbody>
    </table>
  `;

  html2pdf().set({
    margin: [7, 7, 7, 7],
    filename: 'Rajmudra_All_Time_Bank_Treasury_Report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    pagebreak: { mode: ['css', 'legacy'], avoid: ['tr'] },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  }).from(element).save();
}
