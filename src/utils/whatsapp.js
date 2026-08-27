// WhatsApp receipt generator in Marathi language with Prefix, Receipt No, Payment Mode, and Status awareness

export function generateWhatsAppReceipt(vargani, year) {
  const phone = vargani.phone || '';
  const dateStr = new Date(vargani.date).toLocaleDateString('en-IN');
  const amountStr = Number(vargani.amount).toLocaleString('en-IN');
  const prefix = vargani.prefix || 'श्री';
  const paymentModeText = vargani.payment_mode === 'UPI' ? 'ऑनलाईन (UPI)' : 'रोख (Cash)';
  const isPaid = (vargani.status || 'paid') === 'paid';

  let text = `🚩 *राजमुद्रा गणेश उत्सव मंडळ (${year})* 🚩\n\n`;
  text += `${prefix} *${vargani.member_name}*\n`;

  if (isPaid) {
    text += `आपल्याकडून वर्गणी रक्कम: ₹ *${amountStr}* सस्नेह प्राप्त झाली आहे.\n\n`;
  } else {
    text += `आपल्याकडे वर्गणी रक्कम: ₹ *${amountStr}* जमा होणे बाकी आहे. (नम्र विनंती)\n\n`;
  }

  text += `दिनांक: ${dateStr}\n`;
  if (vargani.receipt_no) {
    text += `पावती क्र.: ${vargani.receipt_no}\n`;
  }
  text += `देयक पद्धत: ${paymentModeText}\n`;
  text += `स्थिती: ${isPaid ? 'जमा प्राप्त (Paid)' : 'बाकी (Pending)'}\n\n`;
  text += `आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद! 🙏\n`;
  text += `॥ गणपती बाप्पा मोरया ॥`;

  const encoded = encodeURIComponent(text);
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  if (cleanPhone && cleanPhone.length >= 10) {
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  } else {
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }
}
