// WhatsApp receipt generator and opener

export function generateWhatsAppReceipt(vargani, year) {
  const phone = vargani.phone || '';
  const dateStr = new Date(vargani.date).toLocaleDateString('en-IN');
  const amountStr = Number(vargani.amount).toLocaleString('en-IN');

  const text = `🚩 *Rajmudra Ganesh Utsav Mandal (${year})* 🚩

Dear *${vargani.member_name}*,
Thank you! Your donation of ₹*${amountStr}* has been successfully received.

📅 Date: ${dateStr}
${vargani.note ? `📝 Note/Receipt No: ${vargani.note}\n` : ''}
Ganpati Bappa Morya! 🙏`;

  const encoded = encodeURIComponent(text);
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  if (cleanPhone && cleanPhone.length >= 10) {
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  } else {
    // Open generic WhatsApp share link if no phone number
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }
}
