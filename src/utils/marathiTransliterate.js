// 100% Offline English to Marathi Transliteration Engine

const DICTIONARY = {
  // Surnames
  'patil': 'पाटील',
  'shinde': 'शिंदे',
  'pujari': 'पुजारी',
  'chitale': 'चितळे',
  'pawar': 'पवार',
  'kadam': 'कदम',
  'deshmukh': 'देशमुख',
  'joshi': 'जोशी',
  'kulkarni': 'कुलकर्णी',
  'kulkarani': 'कुलकर्णी',
  'jadhav': 'जाधव',
  'gaikwad': 'गायकवाड',
  'chavan': 'चव्हाण',
  'chavhan': 'चव्हाण',
  'more': 'मोरे',
  'salunkhe': 'साळुंखे',
  'mane': 'मागे',
  'bhosale': 'भोसले',
  'bhosle': 'भोसले',
  'thorat': 'थोरात',
  'kale': 'काळे',
  'jagtap': 'जगताप',
  'khana': 'खान',
  'shaikh': 'शेख',
  'ghatge': 'घाटगे',
  'shirke': 'शिर्के',
  'mohite': 'मोहिते',
  'sawant': 'सावंत',
  'raut': 'राऊत',
  'naik': 'नाईक',
  'deshpande': 'देशपांडे',
  'mhatre': 'म्हात्रे',
  'gupte': 'गुप्ते',
  'shelar': 'शेलार',
  'kambe': 'कांबळे',
  'kamble': 'कांबळे',

  // First Names
  'ramesh': 'रमेश',
  'suresh': 'सुरेश',
  'ganesh': 'गणेश',
  'sachin': 'सचिन',
  'vijay': 'विजय',
  'rahul': 'राहुल',
  'amit': 'अमित',
  'vikas': 'विकास',
  'sanjay': 'संजय',
  'mahesh': 'महेश',
  'prashant': 'प्रशांत',
  'prakash': 'प्रकाश',
  'amol': 'अमोल',
  'sagar': 'सागर',
  'nitin': 'नितीन',
  'sandip': 'संदीप',
  'sandeep': 'संदीप',
  'mangal': 'मंगल',
  'rajendra': 'राजेन्द्र',
  'sunil': 'सुनील',
  'anil': 'अनिल',
  'deepak': 'दीपक',
  'dipak': 'दीपक',
  'dinesh': 'दिनेश',
  'santosh': 'संतोष',
  'vikram': 'विक्रम',
  'maruti': 'मारुती',
  'pandurang': 'पांडुरंग',
  'tukaram': 'तुकाराम',
  'dnyaneshwar': 'ज्ञानेश्वर',
  'shantaram': 'शांताराम',
  'dattatray': 'दत्तात्रय',
  'ashok': 'अशोक',
  'subhash': 'सुभाष',
  'vilas': 'विलास',
  'pradeep': 'प्रदीप',
  'pradip': 'प्रदीप',
  'shambhu': 'शंभू',
  'mahadev': 'महादेव',
  'bhimrao': 'भीमराव',
  'balasaheb': 'बाळासाहेब',
  'nanasaheb': 'नानासाहेब',
  'abasaheb': 'आबासाहेब',
  'raosaheb': 'रावसाहेब',
  'bapusaheb': 'बापूसाहेब',

  // Words & Categories
  'rajmudra': 'राजमुद्रा',
  'mandal': 'मंडळ',
  'vargani': 'वर्गणी',
  'jama': 'जमा',
  'kharch': 'खर्च',
  'aarti': 'आरती',
  'pooja': 'पूजा',
  'puja': 'पूजा',
  'prasadam': 'प्रसाद',
  'prasad': 'प्रसाद',
  'mandap': 'मंडप',
  'sound': 'साऊंड',
  'lighting': 'लाइटिंग',
  'light': 'लाइट',
  'dhol': 'ढोल',
  'tasha': 'ताशा'
};

// Fallback Rule-Based Transliteration
export function transliterateToMarathiWord(word) {
  if (!word) return '';
  const lower = word.toLowerCase().trim();
  if (DICTIONARY[lower]) return DICTIONARY[lower];

  // Phonetic Replacements
  let res = lower
    .replace(/dny|gn/g, 'ज्ञा')
    .replace(/shh/g, 'ष')
    .replace(/sh/g, 'श')
    .replace(/kh/g, 'ख')
    .replace(/gh/g, 'घ')
    .replace(/ch/g, 'च')
    .replace(/jh|zh/g, 'झ')
    .replace(/th/g, 'थ')
    .replace(/dh/g, 'ध')
    .replace(/ph/g, 'फ')
    .replace(/bh/g, 'भ')
    .replace(/k/g, 'क')
    .replace(/g/g, 'ग')
    .replace(/c/g, 'च')
    .replace(/j/g, 'ज')
    .replace(/t/g, 'त')
    .replace(/d/g, 'द')
    .replace(/n/g, 'न')
    .replace(/p/g, 'प')
    .replace(/b/g, 'ब')
    .replace(/m/g, 'म')
    .replace(/y/g, 'य')
    .replace(/r/g, 'र')
    .replace(/l/g, 'ल')
    .replace(/v|w/g, 'व')
    .replace(/s/g, 'स')
    .replace(/h/g, 'ह')
    .replace(/aa/g, 'ा')
    .replace(/a/g, 'ा')
    .replace(/ee|i/g, 'ी')
    .replace(/oo|u/g, 'ू')
    .replace(/e/g, 'े')
    .replace(/o/g, 'ो');

  return res;
}

export function transliterateText(text) {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  const converted = words.map(w => {
    // If word is already Devanagari Marathi script, keep it as is
    if (/[\u0900-\u097F]/.test(w)) return w;
    const lower = w.toLowerCase().replace(/[^a-z]/g, '');
    if (DICTIONARY[lower]) return DICTIONARY[lower];
    return transliterateToMarathiWord(w);
  });
  return converted.join(' ');
}
