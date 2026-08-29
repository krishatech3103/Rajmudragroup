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
  'mane': 'माने',
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

  // Common names and joined devotional phrases
  'shri': 'श्री',
  'shree': 'श्री',
  'utsav': 'उत्सव',
  'ganpati': 'गणपती',
  'bappa': 'बाप्पा',
  'morya': 'मोरया',
  'omkar': 'ओंकार',
  'shubham': 'शुभम',
  'rohit': 'रोहित',
  'pravin': 'प्रवीण',
  'praveen': 'प्रवीण',
  'yogesh': 'योगेश',
  'swapnil': 'स्वप्नील',
  'shrikant': 'श्रीकांत',
  'shreeram': 'श्रीराम',

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
  'tasha': 'ताशा',
  'system': 'सिस्टीम',
  'decoration': 'डेकोरेशन',
  'festival': 'उत्सव',
  'expense': 'खर्च',
  'income': 'उत्पन्न',
  'transport': 'वाहतूक',
  'security': 'सुरक्षा',
  'annadaan': 'अन्नदान',
  'visarjan': 'विसर्जन',
  'procession': 'मिरवणूक',
  'samiti': 'समिती',
  'seva': 'सेवा',
  'yuvak': 'युवक'
};

const DICTIONARY_WORDS = Object.keys(DICTIONARY).sort((left, right) => right.length - left.length);

/**
 * Splits a lower-case joined word only when every part is known. This avoids
 * guessing at a person's name while correctly handling inputs such as
 * "rajmudramandal", "shreeganesh", and "soundsystem".
 */
function splitKnownJoinedWord(value) {
  const matches = Array(value.length + 1).fill(null);
  matches[0] = [];

  for (let start = 0; start < value.length; start += 1) {
    if (!matches[start]) continue;

    for (const knownWord of DICTIONARY_WORDS) {
      if (!value.startsWith(knownWord, start)) continue;
      const end = start + knownWord.length;
      const candidate = [...matches[start], knownWord];
      const existing = matches[end];

      // Prefer fewer, longer known words where more than one split is valid.
      if (!existing || candidate.length < existing.length) matches[end] = candidate;
    }
  }

  const result = matches[value.length];
  return result?.length > 1 ? result : null;
}

function transliterateFallback(lower) {
  return lower
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
}

// Fallback Rule-Based Transliteration
export function transliterateToMarathiWord(word) {
  if (!word) return '';
  const lower = word.toLowerCase().trim();
  if (DICTIONARY[lower]) return DICTIONARY[lower];

  const joinedWords = splitKnownJoinedWord(lower);
  if (joinedWords) return joinedWords.map(knownWord => DICTIONARY[knownWord]).join(' ');

  return transliterateFallback(lower);
}

export function transliterateText(text) {
  if (!text) return '';
  // Preserve spaces, punctuation, and text already written in Marathi. Camel
  // case is treated as joined words, so "SandeepPujari" becomes two names.
  const tokens = String(text).match(/[A-Za-z]+|[\u0900-\u097F]+|[^A-Za-z\u0900-\u097F]+/g) || [];

  return tokens.map(token => {
    if (!/[A-Za-z]/.test(token) || /[\u0900-\u097F]/.test(token)) return token;

    const camelWords = token
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .split(' ')
      .filter(Boolean);

    return camelWords.map(transliterateToMarathiWord).join(' ');
  }).join('');
}
