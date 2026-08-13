const CITY_ALIASES = {
  kurnool: [
    'kurnool',
    'कुरनूल',
    'कुर्नूल',
    'కర్నూలు',
    'కుర్నూలు',
    'ਕੁਰਨੂਲ',
    'কুর্নুল',
    'कुरनूल, आंध्र प्रदेश',
    'kurnool, andhra pradesh',
  ],
  bhiwani: ['bhiwani', 'भिवानी', 'భివాని', 'ਭਿਵਾਨੀ', 'भिवानी', 'ভিওয়ানি'],
  delhi: ['delhi', 'new delhi', 'दिल्ली', 'नई दिल्ली', 'ఢిల్లీ', 'ਦਿੱਲੀ', 'दिल्ली', 'দিল্লি'],
  hyderabad: ['hyderabad', 'हैदराबाद', 'హైదరాబాద్', 'ਹੈਦਰਾਬਾਦ', 'हैदराबाद', 'হায়দরাবাদ'],
  mumbai: ['mumbai', 'bombay', 'मुंबई', 'ముంబై', 'ਮੁੰਬਈ', 'मुंबई', 'মুম্বাই'],
  pune: ['pune', 'पुणे', 'పూణే', 'ਪੁਣੇ', 'पुणे', 'পুনে'],
  bengaluru: ['bengaluru', 'bangalore', 'बेंगलुरु', 'బెంగళూరు', 'ਬੈਂਗਲੁਰੂ', 'बेंगळुरू', 'বেঙ্গালুরু'],
  chennai: ['chennai', 'madras', 'चेन्नई', 'చెన్నై', 'ਚੇਨਈ', 'चेन्नई', 'চেন্নাই'],
  kolkata: ['kolkata', 'calcutta', 'कोलकाता', 'కోల్కతా', 'ਕੋਲਕਾਤਾ', 'कोलकाता', 'কলকাতা'],
  gurugram: ['gurugram', 'gurgaon', 'गुरुग्राम', 'गुड़गांव', 'గురుగ్రామ్', 'ਗੁਰੂਗ੍ਰਾਮ', 'गुरुग्राम', 'গুরগাঁও'],
  noida: ['noida', 'नोएडा', 'నోయిడా', 'ਨੋਇਡਾ', 'नोएडा', 'নয়ডা'],
  ghaziabad: ['ghaziabad', 'गाजियाबाद', 'ఘజియాబాద్', 'ਗਾਜ਼ੀਆਬਾਦ', 'गाझियाबाद', 'গাজিয়াবাদ'],
  faridabad: ['faridabad', 'फरीदाबाद', 'ఫరీదాబాద్', 'ਫਰੀਦਾਬਾਦ', 'फरीदाबाद', 'ফরিদাবাদ'],
  lucknow: ['lucknow', 'लखनऊ', 'లక్నో', 'ਲਖਨਊ', 'लखनौ', 'লখনউ'],
  kanpur: ['kanpur', 'कानपुर', 'కాన్పూర్', 'ਕਾਨਪੁਰ', 'कानपूर', 'কানপুর'],
  jaipur: ['jaipur', 'जयपुर', 'జైపూర్', 'ਜੈਪੁਰ', 'जयपूर', 'জয়পুর'],
  ahmedabad: ['ahmedabad', 'अहमदाबाद', 'అహ్మదాబాద్', 'ਅਹਿਮਦਾਬਾਦ', 'अहमदाबाद', 'আহমেদাবাদ'],
  surat: ['surat', 'सूरत', 'సూరత్', 'ਸੂਰਤ', 'सुरत', 'সুরাট'],
  vadodara: ['vadodara', 'baroda', 'वडोदरा', 'बड़ौदा', 'వడోదర', 'ਵਡੋਦਰਾ', 'वडोदरा', 'ভাদোদরা'],
  indore: ['indore', 'इंदौर', 'ఇండోర్', 'ਇੰਦੌਰ', 'इंदूर', 'ইন্দোর'],
  bhopal: ['bhopal', 'भोपाल', 'భోపాల్', 'ਭੋਪਾਲ', 'भोपाल', 'ভোপাল'],
  nagpur: ['nagpur', 'नागपुर', 'నాగ్‌పూర్', 'ਨਾਗਪੁਰ', 'नागपूर', 'নাগপুর'],
  nashik: ['nashik', 'nasik', 'नाशिक', 'నాశిక్', 'ਨਾਸ਼ਿਕ', 'नाशिक', 'নাশিক'],
  patna: ['patna', 'पटना', 'పాట్నా', 'ਪਟਨਾ', 'पाटणा', 'পাটনা'],
  ranchi: ['ranchi', 'रांची', 'రాంచీ', 'ਰਾਂਚੀ', 'रांची', 'রাঁচি'],
  bhubaneswar: ['bhubaneswar', 'भुवनेश्वर', 'భువనేశ్వర్', 'ਭੁਵਨੇਸ਼ਵਰ', 'भुवनेश्वर', 'ভুবনেশ্বর'],
  chandigarh: ['chandigarh', 'चंडीगढ़', 'చండీగఢ్', 'ਚੰਡੀਗੜ੍ਹ', 'चंदीगड', 'চণ্ডীগড়'],
  amritsar: ['amritsar', 'अमृतसर', 'అమృత్‌సర్', 'ਅੰਮ੍ਰਿਤਸਰ', 'अमृतसर', 'অমৃতসর'],
  ludhiana: ['ludhiana', 'लुधियाना', 'లూధియానా', 'ਲੁਧਿਆਣਾ', 'लुधियाना', 'লুধিয়ানা'],
  kochi: ['kochi', 'cochin', 'कोच्चि', 'కొచ్చి', 'ਕੋਚੀ', 'कोची', 'কোচি'],
  thiruvananthapuram: ['thiruvananthapuram', 'trivandrum', 'तिरुवनंतपुरम', 'తిరువనంతపురం', 'ਤਿਰੁਵਨੰਤਪੁਰਮ', 'तिरुवनंतपुरम', 'তিরুবনন্তপুরম'],
  vijayawada: ['vijayawada', 'विजयवाड़ा', 'విజయవాడ', 'ਵਿਜਯਵਾੜਾ', 'विजयवाडा', 'বিজয়ওয়াড়া'],
  visakhapatnam: ['visakhapatnam', 'vizag', 'विशाखापट्टनम', 'విశాఖపట్నం', 'ਵਿਸਾਖਾਪਟਨਮ', 'विशाखापट्टणम', 'বিশাখাপত্তনম'],
  warangal: ['warangal', 'वरंगल', 'వరంగల్', 'ਵਾਰੰਗਲ', 'वारंगल', 'ওয়ারাঙ্গল'],
  tirupati: ['tirupati', 'तिरुपति', 'తిరుపతి', 'ਤਿਰੁਪਤੀ', 'तिरुपती', 'তিরুপতি'],
  coimbatore: ['coimbatore', 'कोयंबटूर', 'కోయంబత్తూరు', 'ਕੋਇੰਬਤੂਰ', 'कोयंबतूर', 'কোয়েম্বাটোর'],
  madurai: ['madurai', 'मदुरै', 'మదురై', 'ਮਦੁਰਾਈ', 'मदुराई', 'মাদুরাই'],
  dehradun: ['dehradun', 'देहरादून', 'డెహ్రాడూన్', 'ਦੇਹਰਾਦੂਨ', 'देहरादून', 'দেরাদুন'],
  guwahati: ['guwahati', 'गुवाहाटी', 'గువాహటి', 'ਗੁਵਾਹਾਟੀ', 'गुवाहाटी', 'গুয়াহাটি'],
};

const SKILL_ALIASES = {
  cooking: [
    'cooking',
    'cook',
    'खाना बनाना',
    'खाना पकाना',
    'वंट',
    'వంట',
    'ਖਾਣਾ ਬਣਾਉਣਾ',
    'स्वयंपाक',
    'रान्ना',
    'রান্না',
  ],
  cleaning: [
    'cleaning',
    'cleaner',
    'house cleaning',
    'सफाई',
    'साफ सफाई',
    'శుభ్రపరచడం',
    'ਸਫਾਈ',
    'साफसफाई',
    'পরিষ্কার',
  ],
  babysitting: [
    'babysitting',
    'childcare',
    'baby care',
    'बच्चों की देखभाल',
    'चाइल्ड केयर',
    'పిల్లల సంరక్షణ',
    'ਬੱਚਿਆਂ ਦੀ ਦੇਖਭਾਲ',
    'मुलांची काळजी',
    'শিশুর যত্ন',
  ],
  eldercare: [
    'elder care',
    'eldercare',
    'बुजुर्गों की देखभाल',
    'వృద్ధుల సంరక్షణ',
    'ਬਜ਼ੁਰਗਾਂ ਦੀ ਦੇਖਭਾਲ',
    'वृद्धांची काळजी',
    'বয়স্কদের যত্ন',
  ],
  laundry: [
    'laundry',
    'washing clothes',
    'कपड़े धोना',
    'బట్టలు ఉతకడం',
    'ਕੱਪੜੇ ਧੋਣਾ',
    'कपडे धुणे',
    'কাপড় ধোয়া',
  ],
  utensils: [
    'utensils',
    'dishes',
    'dish washing',
    'wash dishes',
    'washing dishes',
    'bartan',
    'बर्तन धोना',
    'బर्तन',
    'గిన్నెలు కడగడం',
    'ਭਾਂਡੇ ਧੋਣਾ',
    'भांडी धुणे',
    'বাসন ধোয়া',
  ],
  mopping: [
    'mopping',
    'pocha',
    'floor mopping',
    'पोछा',
    'फर्श पोंछना',
    'నేల తుడవడం',
    'ਪੋਚਾ',
    'फरशी पुसणे',
    'মেঝে মোছা',
  ],
  sweeping: [
    'sweeping',
    'jhaadu',
    'brooming',
    'झाड़ू',
    'झाडू',
    'చీపురు',
    'ਝਾੜੂ',
    'झाडू मारणे',
    'ঝাড়ু',
  ],
  dusting: [
    'dusting',
    'dust cleaning',
    'धूल साफ करना',
    'డస్టింగ్',
    'ਧੂੜ ਸਾਫ ਕਰਨਾ',
    'धूळ साफ करणे',
    'ধুলো পরিষ্কার',
  ],
  bathroom_cleaning: [
    'bathroom cleaning',
    'toilet cleaning',
    'bathroom',
    'toilet',
    'बाथरूम सफाई',
    'टॉयलेट सफाई',
    'బాత్రూమ్ శుభ్రపరచడం',
    'ਬਾਥਰੂਮ ਸਫਾਈ',
    'बाथरूम साफसफाई',
    'বাথরুম পরিষ্কার',
  ],
  deep_cleaning: [
    'deep cleaning',
    'full house cleaning',
    'festival cleaning',
    'गहरी सफाई',
    'पूरे घर की सफाई',
    'డీప్ క్లీనింగ్',
    'ਡੀਪ ਕਲੀਨਿੰਗ',
    'डीप क्लीनिंग',
    'গভীর পরিষ্কার',
  ],
  kitchen_helper: [
    'kitchen helper',
    'kitchen help',
    'cutting vegetables',
    'vegetable cutting',
    'रसोई सहायक',
    'सब्जी काटना',
    'వంటగది సహాయం',
    'ਸਬਜ਼ੀ ਕੱਟਣਾ',
    'भाजी चिरणे',
    'রান্নাঘরের সাহায্য',
  ],
  cooking_assistant: [
    'cooking assistant',
    'assistant cook',
    'helper cook',
    'कुकिंग असिस्टेंट',
    'रसोई में मदद',
    'వంట సహాయకుడు',
    'ਰਸੋਈ ਵਿੱਚ ਮਦਦ',
    'स्वयंपाक मदतनीस',
    'রান্নার সহকারী',
  ],
  nanny: [
    'nanny',
    'ayah',
    'aaya',
    'baby sitter',
    'आया',
    'नैनी',
    'ఆయా',
    'ਨੈਨੀ',
    'आया',
    'আয়া',
  ],
  patient_care: [
    'patient care',
    'attendant',
    'caregiver',
    'मरीज की देखभाल',
    'अटेंडेंट',
    'రోగి సంరక్షణ',
    'ਮਰੀਜ਼ ਦੀ ਦੇਖਭਾਲ',
    'रुग्णांची काळजी',
    'রোগীর যত্ন',
  ],
  ironing: [
    'ironing',
    'press clothes',
    'कपड़े प्रेस करना',
    'ఇస్త్రీ',
    'ਕੱਪੜੇ ਪ੍ਰੈੱਸ ਕਰਨਾ',
    'इस्त्री',
    'ইস্ত্রি',
  ],
  gardening: [
    'gardening',
    'plant care',
    'माली',
    'बागवानी',
    'తోట పని',
    'ਬਾਗਬਾਨੀ',
    'बागकाम',
    'বাগান করা',
  ],
  pet_care: [
    'pet care',
    'dog walking',
    'pet sitting',
    'पालतू जानवरों की देखभाल',
    'పెంపుడు జంతువుల సంరక్షణ',
    'ਪਾਲਤੂ ਜਾਨਵਰਾਂ ਦੀ ਦੇਖਭਾਲ',
    'पाळीव प्राण्यांची काळजी',
    'পোষা প্রাণীর যত্ন',
  ],
  live_in_help: [
    'live in help',
    'live-in help',
    'full time maid',
    '24 hour maid',
    'रहने वाली मेड',
    'फुल टाइम मेड',
    'లైవ్ ఇన్ హెల్ప్',
    'ਰਹਿਣ ਵਾਲੀ ਮੇਡ',
    'राहणारी मदतनीस',
    'লাইভ ইন সাহায্য',
  ],
};

function cleanText(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[।.,;:()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeLookup(aliasGroups) {
  return Object.entries(aliasGroups).reduce((lookup, [code, aliases]) => {
    aliases.forEach((alias) => {
      lookup[cleanText(alias)] = code;
    });
    return lookup;
  }, {});
}

const CITY_LOOKUP = makeLookup(CITY_ALIASES);
const SKILL_LOOKUP = makeLookup(SKILL_ALIASES);

function normalizeByLookup(raw, lookup) {
  const cleaned = cleanText(raw);
  if (!cleaned) return '';

  const commaBase = cleaned.split(',')[0].trim();
  return lookup[cleaned] || lookup[commaBase] || cleaned.replace(/\s+/g, '-');
}

export function normalizeCityCode(raw) {
  return normalizeByLookup(raw, CITY_LOOKUP);
}

export function normalizeSkillCode(raw) {
  const cleaned = cleanText(raw);
  if (!cleaned) return '';

  if (SKILL_LOOKUP[cleaned]) return SKILL_LOOKUP[cleaned];
  
//partial matching like someone wrote kitchen cleaning services
  const matchedAlias = Object.keys(SKILL_LOOKUP)
    .sort((a, b) => b.length - a.length)
    .find((alias) => cleaned.includes(alias));

  return matchedAlias ? SKILL_LOOKUP[matchedAlias] : cleaned.replace(/\s+/g, '-');
}

export function normalizeSkillCodes(rawSkills) {
  const skills = Array.isArray(rawSkills)
    ? rawSkills
    : String(rawSkills || '').split(/[,/|]+/);

  const codes = new Set();

  skills.forEach((skill) => {
    const normalized = normalizeSkillCode(skill);
    if (normalized) codes.add(normalized);

    const cleaned = cleanText(skill);
    Object.entries(SKILL_LOOKUP).forEach(([alias, code]) => {
      if (cleaned.includes(alias)) codes.add(code);
    });
  });

  return [...codes];
}

export function workerCityCodes(worker = {}) {
  return [
    worker.cityCode,
    normalizeCityCode(worker.cityArea),
    normalizeCityCode(worker.city),
  ].filter(Boolean);
}

export function workerSkillCodes(worker = {}) {
  return [
    ...(Array.isArray(worker.skillCodes) ? worker.skillCodes : []),
    ...normalizeSkillCodes(worker.skills),
  ].filter(Boolean);
}
