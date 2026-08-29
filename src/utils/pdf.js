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

export function generatePDFReport(year, data = {}) {
  const ledgerData = data || {};
  const summary = calculateSummary(year, ledgerData);
  const vargani = (Array.isArray(ledgerData.vargani) ? ledgerData.vargani : []).filter(record => !year || record?.year === year);
  const kharchCats = getKharchByCategory(year, ledgerData.kharch);

  const element = document.createElement('div');
  element.style.padding = '35px';
  element.style.fontFamily = "'Noto Sans Devanagari', 'Outfit', sans-serif";
  element.style.color = '#0F172A';
  element.style.background = '#ffffff';

  const fmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;
  const safeYear = escapeHtml(year);
  const now = new Date();
  const dateStr = now.toLocaleDateString('mr-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' });

  element.innerHTML = `
    <!-- Header Banner with Royal Saffron Border -->
    <div style="border: 3px double #D84315; border-radius: 16px; padding: 20px; text-align: center; background: linear-gradient(135deg, #FFF5ED 0%, #FFE0B2 100%); margin-bottom: 25px;">
      <h3 style="margin: 0; color: #D84315; font-size: 16px; font-weight: 800;">॥ श्री गणेशाय नमः ॥</h3>
      <h1 style="margin: 6px 0; color: #9A2A2A; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
        राजमुद्रा गणेशोत्सव मंडळ
      </h1>
      <h2 style="margin: 4px 0 0 0; color: #2D3748; font-size: 17px; font-weight: 800;">
        वार्षिक जमा-खर्च व हिशोब पत्रक (उत्सव वर्ष: ${safeYear})
      </h2>
      <div style="margin-top: 10px; font-size: 12px; color: #4A5568; font-weight: 700;">
        अहवाल निर्मिती दिनांक: <b>${dateStr}</b> | वेळ: <b>${timeStr}</b>
      </div>
    </div>

    <!-- 1. Summary Financial Table -->
    <div style="margin-bottom: 25px;">
      <h3 style="color: #9A2A2A; font-size: 16px; font-weight: 900; border-bottom: 2px solid #D84315; padding-bottom: 6px; margin-bottom: 12px;">
        १. आर्थिक संक्षिप्त विवरण (Financial Summary)
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #E2E8F0; color: #0F172A; text-align: left;">
            <th style="padding: 10px; border: 1px solid #CBD5E1;">हिशोब तपशील (Account Head)</th>
            <th style="padding: 10px; border: 1px solid #CBD5E1; text-align: right;">रक्कम (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 9px; border: 1px solid #E2E8F0;">एकूण सभासद वर्गणी (Member Donations)</td>
            <td style="padding: 9px; border: 1px solid #E2E8F0; text-align: right; font-weight: 700;">${fmt(summary.vargani)}</td>
          </tr>
          <tr>
            <td style="padding: 9px; border: 1px solid #E2E8F0;">इतर जमा व जाहिरात उत्पन्न (Other Income)</td>
            <td style="padding: 9px; border: 1px solid #E2E8F0; text-align: right; font-weight: 700;">${fmt(summary.jama)}</td>
          </tr>
          <tr style="background: #ECFDF5;">
            <td style="padding: 10px; border: 1px solid #A7F3D0; color: #065F46; font-weight: 800;">सर्व एकूण जमा रक्कम (Total Revenue)</td>
            <td style="padding: 10px; border: 1px solid #A7F3D0; text-align: right; color: #065F46; font-weight: 900; font-size: 15px;">${fmt(summary.income)}</td>
          </tr>
          <tr style="background: #FEF2F2;">
            <td style="padding: 10px; border: 1px solid #FCA5A5; color: #991B1B; font-weight: 800;">सर्व एकूण झालेला खर्च (Total Expenses)</td>
            <td style="padding: 10px; border: 1px solid #FCA5A5; text-align: right; color: #991B1B; font-weight: 900; font-size: 15px;">${fmt(summary.kharch)}</td>
          </tr>
          <tr style="background: #FFFBEB;">
            <td style="padding: 11px; border: 1px solid #FDE68A; color: #92400E; font-weight: 900;">अंतिम शिलक रक्कम (Net Balance / Surplus)</td>
            <td style="padding: 11px; border: 1px solid #FDE68A; text-align: right; color: #92400E; font-weight: 900; font-size: 16px;">${fmt(summary.balance)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 2. Expenses Category Breakdown -->
    <div style="margin-bottom: 25px;">
      <h3 style="color: #9A2A2A; font-size: 16px; font-weight: 900; border-bottom: 2px solid #D84315; padding-bottom: 6px; margin-bottom: 12px;">
        २. खर्च वर्गवारी तपशील (Expenses Breakdown)
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #FEF2F2; color: #991B1B; text-align: left;">
            <th style="padding: 9px; border: 1px solid #FCA5A5;">खर्चाचे कारण / वर्गवारी</th>
            <th style="padding: 9px; border: 1px solid #FCA5A5; text-align: right;">एकूण रक्कम (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${kharchCats.length === 0 ? `
            <tr><td colspan="2" style="padding: 12px; text-align: center; color: #64748B; border: 1px solid #E2E8F0;">कोणतीही खर्चाची नोंद उपलब्ध नाही.</td></tr>
          ` : kharchCats.map(c => `
            <tr>
              <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: 600;">${escapeHtml(c.category)}</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right; font-weight: 800; color: #DC2626;">${fmt(c.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- 3. Member Donations Ledger -->
    <div style="margin-bottom: 30px;">
      <h3 style="color: #9A2A2A; font-size: 16px; font-weight: 900; border-bottom: 2px solid #D84315; padding-bottom: 6px; margin-bottom: 12px;">
        ३. वर्गणीदार सभासद हिशोब नोंद (Donations Ledger - ${vargani.length} नोंदी)
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #EFF6FF; color: #1E40AF; text-align: left;">
            <th style="padding: 7px; border: 1px solid #BFDBFE; width: 40px; text-align: center;">अ.क्र.</th>
            <th style="padding: 7px; border: 1px solid #BFDBFE;">दिनांक</th>
            <th style="padding: 7px; border: 1px solid #BFDBFE;">सभासदाचे नाव</th>
            <th style="padding: 7px; border: 1px solid #BFDBFE;">पावती / टीप</th>
            <th style="padding: 7px; border: 1px solid #BFDBFE; text-align: right;">रक्कम (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${vargani.length === 0 ? `
            <tr><td colspan="5" style="padding: 12px; text-align: center; color: #64748B; border: 1px solid #E2E8F0;">वर्गणीची नोंद उपलब्ध नाही.</td></tr>
          ` : vargani.map((v, idx) => `
            <tr>
              <td style="padding: 7px; border: 1px solid #E2E8F0; text-align: center;">${idx + 1}</td>
              <td style="padding: 7px; border: 1px solid #E2E8F0;">${new Date(v.date).toLocaleDateString('mr-IN')}</td>
              <td style="padding: 7px; border: 1px solid #E2E8F0; font-weight: 700;">${escapeHtml(v.member_name)}</td>
              <td style="padding: 7px; border: 1px solid #E2E8F0; color: #64748B;">${escapeHtml(v.note || '-')}</td>
              <td style="padding: 7px; border: 1px solid #E2E8F0; text-align: right; color: #1D4ED8; font-weight: 800;">${fmt(v.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- 4. Mandal Executive Signatures -->
    <div style="margin-top: 50px; padding-top: 20px; border-top: 1px dashed #CBD5E1; display: flex; justify-content: space-between; text-align: center; font-size: 13px; color: #334155;">
      <div>
        <div style="height: 40px;"></div>
        <p style="margin: 0; font-weight: 800;">( ___________________ )</p>
        <p style="margin: 4px 0 0 0; font-weight: 900; color: #9A2A2A;">अध्यक्ष</p>
        <span style="font-size: 11px; color: #64748B;">राजमुद्रा गणेशोत्सव मंडळ</span>
      </div>

      <div>
        <div style="height: 40px;"></div>
        <p style="margin: 0; font-weight: 800;">( ___________________ )</p>
        <p style="margin: 4px 0 0 0; font-weight: 900; color: #9A2A2A;">सचिव</p>
        <span style="font-size: 11px; color: #64748B;">राजमुद्रा गणेशोत्सव मंडळ</span>
      </div>

      <div>
        <div style="height: 40px;"></div>
        <p style="margin: 0; font-weight: 800;">( ___________________ )</p>
        <p style="margin: 4px 0 0 0; font-weight: 900; color: #9A2A2A;">खजिनदार</p>
        <span style="font-size: 11px; color: #64748B;">राजमुद्रा गणेशोत्सव मंडळ</span>
      </div>
    </div>
  `;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Rajmudra_Mandal_Ahaval_${year}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

const formatDate = (value, locale = 'en-IN') => value
  ? new Date(value).toLocaleDateString(locale)
  : '-';

export function generateAartiSchedulePDF(year, records = []) {
  const schedule = (Array.isArray(records) ? records : [])
    .filter(record => record?.year === year)
    .sort((left, right) => String(left.date || '').localeCompare(String(right.date || '')));
  const element = document.createElement('div');
  element.style.width = '190mm';
  element.style.padding = '5mm';
  element.style.boxSizing = 'border-box';
  element.style.fontFamily = "'Noto Sans Devanagari', 'Outfit', sans-serif";
  element.style.color = '#1F2937';
  element.style.background = '#ffffff';

  element.innerHTML = `
    <div style="text-align:center; border-bottom:2px solid #D84315; padding-bottom:3mm; margin-bottom:3mm;">
      <div style="font-size:10px; color:#D84315; font-weight:800;">॥ श्री गणेशाय नमः ॥</div>
      <div style="font-size:17px; color:#9A2A2A; font-weight:900; margin:1mm 0;">राजमुद्रा गणेशोत्सव मंडळ</div>
      <div style="font-size:11px; font-weight:800;">आरती वेळापत्रक / Aarti Schedule — Festival Year ${escapeHtml(year)}</div>
    </div>
    <table style="width:100%; border-collapse:collapse; font-size:8px; table-layout:fixed;">
      <thead>
        <tr style="background:#FFF3E0; color:#9A3412;">
          <th style="width:12%; padding:5px; border:1px solid #FDBA74;">Date</th>
          <th style="width:18%; padding:5px; border:1px solid #FDBA74;">Day</th>
          <th style="width:31%; padding:5px; border:1px solid #FDBA74;">Morning Aarti</th>
          <th style="width:31%; padding:5px; border:1px solid #FDBA74;">Evening Aarti</th>
          <th style="width:8%; padding:5px; border:1px solid #FDBA74;">Note</th>
        </tr>
      </thead>
      <tbody>
        ${schedule.length ? schedule.map((item, index) => `
          <tr style="background:${index % 2 ? '#FFFDF8' : '#FFFFFF'};">
            <td style="padding:5px; border:1px solid #E5E7EB; font-weight:700;">${escapeHtml(formatDate(item.date))}</td>
            <td style="padding:5px; border:1px solid #E5E7EB; font-weight:800;">${escapeHtml(item.day_title)}</td>
            <td style="padding:5px; border:1px solid #E5E7EB;"><b>${escapeHtml(item.morning_time || '-')}</b><br>${escapeHtml(item.morning_host || '-')}</td>
            <td style="padding:5px; border:1px solid #E5E7EB;"><b>${escapeHtml(item.evening_time || '-')}</b><br>${escapeHtml(item.evening_host || '-')}</td>
            <td style="padding:5px; border:1px solid #E5E7EB; font-size:7px;">${escapeHtml(item.note || '-')}</td>
          </tr>
        `).join('') : '<tr><td colspan="5" style="padding:15px; border:1px solid #E5E7EB; text-align:center;">No Aarti schedule entries.</td></tr>'}
      </tbody>
    </table>
    <div style="margin-top:3mm; text-align:center; font-size:7px; color:#6B7280;">Generated ${escapeHtml(formatDate(new Date()))} • Ganpati Bappa Morya</div>
  `;

  html2pdf().set({
    margin: [5, 5, 5, 5],
    filename: `Rajmudra_Aarti_Schedule_${year}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
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
    <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2px solid #047857; padding-bottom:4mm; margin-bottom:4mm;">
      <div><div style="font-size:17px; font-weight:900; color:#065F46;">Rajmudra Mandal Bank & Treasury</div><div style="font-size:10px; color:#64748B; font-weight:700;">All-time transaction report — separate from yearly income and expenses</div></div>
      <div style="text-align:right;"><div style="font-size:9px; color:#64748B;">CURRENT BANK / FD BALANCE</div><div style="font-size:16px; font-weight:900; color:#047857;">₹${Number(summary.current_fd_balance).toLocaleString('en-IN')}</div></div>
    </div>
    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:3mm; margin-bottom:4mm; font-size:9px;">
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
          return `<tr style="background:${index % 2 ? '#F8FAFC' : '#FFFFFF'};"><td style="padding:5px; border:1px solid #E2E8F0;">${escapeHtml(formatDate(item.date))}</td><td style="padding:5px; border:1px solid #E2E8F0;">${escapeHtml(item.year || '-')}</td><td style="padding:5px; border:1px solid #E2E8F0;">${escapeHtml(bankEntryLabel(item.type))}</td><td style="padding:5px; border:1px solid #E2E8F0;"><b>${escapeHtml(item.title)}</b>${item.bank_name ? ` • ${escapeHtml(item.bank_name)}` : ''}${item.holder_name ? `<br><span style="color:#334155; font-weight:700;">Held by: ${escapeHtml(item.holder_name)}</span>` : ''}${item.note ? `<br><span style="color:#64748B;">${escapeHtml(item.note)}</span>` : ''}</td><td style="padding:5px; border:1px solid #E2E8F0; text-align:right; font-weight:800; color:${outgoing ? '#DC2626' : transfer ? '#2563EB' : '#047857'};">${transfer ? '↔' : outgoing ? '-' : '+'} ₹${Number(item.amount).toLocaleString('en-IN')}</td></tr>`;
        }).join('') : '<tr><td colspan="5" style="padding:15px; border:1px solid #E2E8F0; text-align:center;">No bank or treasury entries.</td></tr>'}
      </tbody>
    </table>
  `;

  html2pdf().set({
    margin: [7, 7, 7, 7],
    filename: 'Rajmudra_All_Time_Bank_Treasury_Report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  }).from(element).save();
}
