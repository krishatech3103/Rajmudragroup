function formatNoticeTime(value) {
  return String(value || '')
    .replace(/\b(?:AM|PM)\b/gi, '')
    .replace(/\s*वा\.?\s*$/u, '')
    .trim();
}

export function buildAartiNoticeText(item, type = 'morning', defaultTimes = {}, dayLabel = 'उद्या') {
  const isMorning = type === 'morning';
  const rawTime = isMorning
    ? (item?.morning_time || defaultTimes.morningTime)
    : (item?.evening_time || defaultTimes.eveningTime);
  const timeText = formatNoticeTime(rawTime);
  const sessionText = isMorning ? 'सकाळी' : 'संध्याकाळी';
  const hostText = isMorning ? (item?.morning_host || '1 व 2 परिवार') : (item?.evening_host || 'मंडळ परिवार');

  return `*🚩 राजमुद्रा गणेश व नवरात्र उत्सव मंडळ 🚩*\n` +
    `*🙏${dayLabel} ${sessionText} ठिक ${timeText ? `${timeText} वा.` : 'वेळ'} ${hostText} यांच्या परिवाराच्या हस्ते आरती संपन्न होईल, कृपया सर्वांनी वेळेत हजर रहावे.🙏*\n` +
    `*🌸 गणपति बाप्पा मोरया 🌸*`;
}
