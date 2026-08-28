import html2pdf from 'html2pdf.js';
import { calculateSummary, getKharchByCategory } from './ledger';

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
