import html2pdf from 'html2pdf.js';
import { calculateBankFDSummary, calculateSummary, getKharchByCategory, isBankTransferType } from './ledger';

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
      <h1 style="margin:5px 0; color:#9A2A2A; font-size:22px; font-weight:900;">राजमुद्रा गणेशोत्सव मंडळ</h1>
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

export function generateAartiSchedulePDF(year, records = []) {
  const schedule = (Array.isArray(records) ? records : [])
    .filter(record => record?.year === year)
    .sort((left, right) => String(left.date || '').localeCompare(String(right.date || '')));
  const formatAartiDate = (value) => formatDate(value, 'mr-IN');
  const formatAartiTime = (value) => String(value || '—')
    .replace(/\bAM\b/gi, 'सकाळी')
    .replace(/\bPM\b/gi, 'सायंकाळी');
  const element = document.createElement('div');
  element.style.width = '190mm';
  element.style.padding = '5mm';
  element.style.boxSizing = 'border-box';
  element.style.fontFamily = "'Noto Sans Devanagari', 'Outfit', sans-serif";
  element.style.color = '#1F2937';
  element.style.background = '#ffffff';

  element.innerHTML = `
    <div style="${'page-break-inside:avoid; break-inside:avoid;'} text-align:center; border-bottom:2px solid #D84315; padding-bottom:3mm; margin-bottom:3mm;">
      <div style="font-size:10px; color:#D84315; font-weight:800;">॥ श्री गणेशाय नमः ॥</div>
      <div style="font-size:17px; color:#9A2A2A; font-weight:900; margin:1mm 0;">राजमुद्रा गणेशोत्सव मंडळ</div>
      <div style="font-size:11px; font-weight:800;">आरती वेळापत्रक — उत्सव वर्ष ${escapeHtml(year)}</div>
    </div>
    <table style="width:100%; border-collapse:collapse; font-size:8px; table-layout:fixed;">
      <thead>
        <tr style="background:#FFF3E0; color:#9A3412;">
          <th style="width:12%; padding:5px; border:1px solid #FDBA74;">दिनांक</th>
          <th style="width:18%; padding:5px; border:1px solid #FDBA74;">दिवस</th>
          <th style="width:31%; padding:5px; border:1px solid #FDBA74;">सकाळची आरती</th>
          <th style="width:31%; padding:5px; border:1px solid #FDBA74;">सायंकाळची आरती</th>
          <th style="width:8%; padding:5px; border:1px solid #FDBA74;">टीप</th>
        </tr>
      </thead>
      <tbody>
        ${schedule.length ? schedule.map((item, index) => `
          <tr style="page-break-inside:avoid; break-inside:avoid; background:${index % 2 ? '#FFFDF8' : '#FFFFFF'};">
            <td style="padding:5px; border:1px solid #E5E7EB; font-weight:700;">${escapeHtml(formatAartiDate(item.date))}</td>
            <td style="padding:5px; border:1px solid #E5E7EB; font-weight:800;">${escapeHtml(item.day_title)}</td>
            <td style="padding:5px; border:1px solid #E5E7EB;"><b>${escapeHtml(formatAartiTime(item.morning_time))}</b><br>${escapeHtml(item.morning_host || '—')}</td>
            <td style="padding:5px; border:1px solid #E5E7EB;"><b>${escapeHtml(formatAartiTime(item.evening_time))}</b><br>${escapeHtml(item.evening_host || '—')}</td>
            <td style="padding:5px; border:1px solid #E5E7EB; font-size:7px;">${escapeHtml(item.note || '—')}</td>
          </tr>
        `).join('') : '<tr><td colspan="5" style="padding:15px; border:1px solid #E5E7EB; text-align:center;">आरती वेळापत्रकाची कोणतीही नोंद उपलब्ध नाही.</td></tr>'}
      </tbody>
    </table>
    <div style="page-break-inside:avoid; break-inside:avoid; margin-top:3mm; text-align:center; font-size:7px; color:#6B7280;">तयार केले दिनांक ${escapeHtml(formatAartiDate(new Date()))} • गणपती बाप्पा मोरया</div>
  `;

  html2pdf().set({
    margin: [5, 5, 5, 5],
    filename: `आरती_वेळापत्रक_${year}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    pagebreak: { mode: ['css', 'legacy'], avoid: ['tr'] },
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
