// WhatsApp receipt generator in Marathi language

export function generateWhatsAppReceipt(vargani, year) {
  const phone = vargani.phone || '';
  const dateStr = new Date(vargani.date).toLocaleDateString('en-IN');
  const amountStr = Number(vargani.amount).toLocaleString('en-IN');

  const text = `🚩 *राजमुद्रा गणेश उत्सव मंडळ (${year})* 🚩

श्री / श्रीमती: *${vargani.member_name}*
आपल्याकडून वर्गणी रक्कम: ₹ *${amountStr}* सस्नेह प्राप्त झाली आहे.

दिनांक: ${dateStr}
${vargani.note ? `पावती क्र. / टीप: ${vargani.note}\n` : ''}
आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद! 🙏
॥ गणपती बाप्पा मोरया ॥`;

  const encoded = encodeURIComponent(text);
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  if (cleanPhone && cleanPhone.length >= 10) {
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  } else {
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }
}
