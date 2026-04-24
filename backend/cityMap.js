// key: lowercased original city string (any script)
// value: normalized English form used for search
export const CITY_MAP = {
  // Kurnool
  'కర్నూలు': 'kurnool',
  'कुर्नूल': 'kurnool',
  'कुर्नूल, आंध्र प्रदेश': 'kurnool',
  'কুরনুল': 'kurnool',
  'ಕುರುನುಲ್': 'kurnool',
  'kurnool': 'kurnool',
  'కర్నూలు, ఆంధ్రప్రదేశ్.': 'kurnool',
  'kurnool, andhra pradesh': 'kurnool',

  // Hyderabad
  'हैदराबाद': 'hyderabad',
  'हैदराबाद, तेलंगाना': 'hyderabad',
  'హైదరాబాద్': 'hyderabad',
  'hyderabad': 'hyderabad',
  'हैद्राबाद': 'hyderabad',
  'হায়দরাবাদ': 'hyderabad',
  'ಹೈದ್ರಾಬಾದ್': 'hyderabad',

  // Delhi
  'delhi': 'delhi',
  'नई दिल्ली': 'delhi',
  'दिल्ली': 'delhi',
  'నవ ఢిల్లీ': 'delhi',
  'दिल्ली, भारत': 'delhi',
  'দিল্লি': 'delhi',
  'ನವದೆಹಲಿ': 'delhi',

  // Mumbai
  'mumbai': 'mumbai',
  'मुंबई': 'mumbai',
  'बॉम्बे': 'mumbai',
  'ముంబई': 'mumbai',
  'मुंबई, महाराष्ट्र': 'mumbai',
  'মুম্বাই': 'mumbai',
  'ಮುಂಬೈ': 'mumbai',

  // Pune
  'pune': 'pune',
  'पुणे': 'pune',
  'पूणे': 'pune',
  'పుణే': 'pune',
  'পুনে': 'pune',
  'ಪುಣೆ': 'pune',

  // Bengaluru / Bangalore
  'bengaluru': 'bengaluru',
  'bangalore': 'bengaluru',
  'बेंगलुरु': 'bengaluru',
  'बैंगलोर': 'bengaluru',
  'బెంగళూరు': 'bengaluru',
  'বেঙ্গালুরু': 'bengaluru',
  'ಬೆಂಗಳೂರು': 'bengaluru',

  // Chennai
  'chennai': 'chennai',
  'चेन्नई': 'chennai',
  'मद्रास': 'chennai',
  'చెన్నై': 'chennai',
  'চেন্নাই': 'chennai',
  'ಚೆನ್ನೈ': 'chennai',

  // Kolkata
  'kolkata': 'kolkata',
  'कोलकाता': 'kolkata',
  'कलकत्ता': 'kolkata',
  'కొలకతా': 'kolkata',
  'কলকাতা': 'kolkata',
  'ಕೊಲ್ಕತ್ತಾ': 'kolkata',

  // Ahmedabad
  'ahmedabad': 'ahmedabad',
  'अहमदाबाद': 'ahmedabad',
  'अहमदाबाद, गुजरात': 'ahmedabad',
  'అహ్మదాబాద్': 'ahmedabad',
  'আহমেদাবাদ': 'ahmedabad',
  'ಅಹಮದಾಬಾದ್': 'ahmedabad',

  // Jaipur
  'jaipur': 'jaipur',
  'जयपुर': 'jaipur',
  'जयपुर, राजस्थान': 'jaipur',
  'జయపూర్': 'jaipur',
  'জয়পুর': 'jaipur',
  'ಜಯಪూర్': 'jaipur',

  // Lucknow
  'lucknow': 'lucknow',
  'लखनऊ': 'lucknow',
  'लखनऊ, उत्तर प्रदेश': 'lucknow',
  'లక్నో': 'lucknow',
  'লখনউ': 'lucknow',
  'ಲಖನೌ': 'lucknow',

  // Kanpur
  'kanpur': 'kanpur',
  'कानपुर': 'kanpur',
  'कानपुर, उत्तर प्रदेश': 'kanpur',
  'కాన్పూర్': 'kanpur',
  'কানপুর': 'kanpur',
  'ಕಾನ್ಪುರ': 'kanpur',

  // Nagpur
  'nagpur': 'nagpur',
  'नागपुर': 'nagpur',
  'नागपूर': 'nagpur',
  'నాగ్‌పూర్': 'nagpur',
  'নাগপুর': 'nagpur',
  'ನಾಗ್ಪುರ': 'nagpur',

  // Indore
  'indore': 'indore',
  'इंदौर': 'indore',
  'इन्दौर': 'indore',
  'ఇందోర్': 'indore',
  'ইন্দোর': 'indore',
  'ಇಂದೋರ್': 'indore',

  // Bhopal
  'bhopal': 'bhopal',
  'भोपाल': 'bhopal',
  'భోపాల్': 'bhopal',
  'ভোপাল': 'bhopal',
  'ಭೋಪಾಲ್': 'bhopal',

  // Surat
  'surat': 'surat',
  'सूरत': 'surat',
  'సూరత్': 'surat',
  'সুরাট': 'surat',
  'ಸೂರತ್': 'surat',

  // Vadodara / Baroda
  'vadodara': 'vadodara',
  'baroda': 'vadodara',
  'वडोदरा': 'vadodara',
  'బరోడా': 'vadodara',
  'ভাডোদরা': 'vadodara',
  'ವಡೋದರಾ': 'vadodara',

  // Rajkot
  'rajkot': 'rajkot',
  'राजकोट': 'rajkot',
  'రాజ్‌కోట్': 'rajkot',
  'রাজকোট': 'rajkot',
  'ರಾಜ್ಕೋಟ': 'rajkot',

  // Thane
  'thane': 'thane',
  'ठाणे': 'thane',
  'ठाणे, महाराष्ट्र': 'thane',
  'థానే': 'thane',
  'ঠাণে': 'thane',
  'ಥಾಣೆ': 'thane',

  // Nashik
  'nashik': 'nashik',
  'nasik': 'nashik',
  'नाशिक': 'nashik',
  'নাশিক': 'nashik',
  'ನಾಶಿಕ್': 'nashik',

  // Aurangabad
  'aurangabad': 'aurangabad',
  'औरंगाबाद': 'aurangabad',
  'औरंगाबाद, महाराष्ट्र': 'aurangabad',
  'ఔరంగాబాద్': 'aurangabad',
  'ঔরঙ্গাবাদ': 'aurangabad',
  'ಔರಂಗಾಬಾದ್': 'aurangabad',

  // Patna
  'patna': 'patna',
  'पटना': 'patna',
  'पटना, बिहार': 'patna',
  'పట్నా': 'patna',
  'পাটনা': 'patna',
  'ಪಾಟ್ನಾ': 'patna',

  // Ranchi
  'ranchi': 'ranchi',
  'रांची': 'ranchi',
  'రాంచీ': 'ranchi',
  'রাঁচি': 'ranchi',
  'ರಾಂಚಿ': 'ranchi',

  // Bhubaneswar
  'bhubaneswar': 'bhubaneswar',
  'भुवनेश्वर': 'bhubaneswar',
  'భువనేశ్వర్': 'bhubaneswar',
  'ভুবনেশ্বর': 'bhubaneswar',
  'ಭುವನೇಶ್ವರ': 'bhubaneswar',

  // Cuttack
  'cuttack': 'cuttack',
  'कटक': 'cuttack',
  'कट्टक': 'cuttack',
  'కటక్': 'cuttack',
  'কটক': 'cuttack',
  'ಕಟಕ್': 'cuttack',

  // Guwahati
  'guwahati': 'guwahati',
  'गुवाहाटी': 'guwahati',
  'గువાહటి': 'guwahati',
  'গুয়াহাটি': 'guwahati',
  'ಗುವಾಹಟಿ': 'guwahati',

  // Chandigarh
  'chandigarh': 'chandigarh',
  'चंडीगढ़': 'chandigarh',
  'చండీగఢ్': 'chandigarh',
  'চন্ডীগড়': 'chandigarh',
  'ಚಂಡೀಗಢ': 'chandigarh',

  // Noida
  'noida': 'noida',
  'नोएडा': 'noida',
  'నోయిడా': 'noida',
  'নয়ডা': 'noida',
  'ನೋಯ್ಡಾ': 'noida',

  // Gurgaon / Gurugram
  'gurgaon': 'gurugram',
  'gurugram': 'gurugram',
  'गुड़गांव': 'gurugram',
  'गुरुग्राम': 'gurugram',
  'గుర్గావ్': 'gurugram',
  'গুরগাঁও': 'gurugram',
  'ಗುರ್ಗಾವ್': 'gurugram',

  // Kochi / Cochin
  'kochi': 'kochi',
  'cochin': 'kochi',
  'कोच्चि': 'kochi',
  'ಕೊಚ್ಚಿ': 'kochi',
  'कोच्ची': 'kochi',
  'कोचीन': 'kochi',
  'কোচি': 'kochi',

  // Thiruvananthapuram
  'thiruvananthapuram': 'thiruvananthapuram',
  'trivandrum': 'thiruvananthapuram',
  'तिरुवनंतपुरम': 'thiruvananthapuram',
  'తిరువనంతపురం': 'thiruvananthapuram',
  'তিরুবনন্তপুরম': 'thiruvananthapuram',
  'ತಿರುವನಂತಪುರಂ': 'thiruvananthapuram',

  // Mysuru / Mysore
  'mysore': 'mysuru',
  'mysuru': 'mysuru',
  'मैसूर': 'mysuru',
  'मैसूरु': 'mysuru',
  'మైసూరు': 'mysuru',
  'মাইসুরু': 'mysuru',
  'ಮೈಸೂರು': 'mysuru',

  // Mangaluru / Mangalore
  'mangalore': 'mangaluru',
  'mangaluru': 'mangaluru',
  'मैंगलोर': 'mangaluru',
  'మంగళూరు': 'mangaluru',
  'মঙ্গালুরু': 'mangaluru',
  'ಮಂಗಳೂರು': 'mangaluru',

  // Vijayawada
  'vijayawada': 'vijayawada',
  'विजयवाड़ा': 'vijayawada',
  'విజయవాడ': 'vijayawada',
  'বিজয়ওয়াড়া': 'vijayawada',
  'ವಿಜಯವಾಡ': 'vijayawada',

  // Visakhapatnam
  'visakhapatnam': 'visakhapatnam',
  'vizag': 'visakhapatnam',
  'विशाखापत्तनम': 'visakhapatnam',
  'విశాఖపట్నం': 'visakhapatnam',
  'বিশাখাপত্তনম': 'visakhapatnam',
  'ವಿಶಾಖಪಟ್ಟಣಂ': 'visakhapatnam',

  // Warangal
  'warangal': 'warangal',
  'वरंगल': 'warangal',
  'వరంగల్': 'warangal',
  'ওয়ারাঙ্গল': 'warangal',
  'ವರಂಗಲ್': 'warangal',

  // Nizamabad
  'nizamabad': 'nizamabad',
  'निजामाबाद': 'nizamabad',
  'నిజామాబాద్': 'nizamabad',
  'নিজামাবাদ': 'nizamabad',
  'ನಿಜಾಮಾಬಾದ್': 'nizamabad',

  // Tirupati
  'tirupati': 'tirupati',
  'तिरुपति': 'tirupati',
  'తిరుపతి': 'tirupati',
  'তিরুপতি': 'tirupati',
  'ತಿರುಪತಿ': 'tirupati',

  // Madurai
  'madurai': 'madurai',
  'मदुरै': 'madurai',
  'మదురై': 'madurai',
  'মদুরাই': 'madurai',
  'ಮದುರೈ': 'madurai',

  // Coimbatore
  'coimbatore': 'coimbatore',
  'कोयंबटूर': 'coimbatore',
  'కొయంబత్తూర్': 'coimbatore',
  'কোয়েম্বাটোর': 'coimbatore',
  'ಕೊಯಂಬತ್ತೂರು': 'coimbatore',

  // Salem
  'salem': 'salem',
  'सलेम': 'salem',
  'సేలెం': 'salem',
  'সেলেম': 'salem',
  'ಸೇಲಂ': 'salem',

  // Tiruchirappalli
  'tiruchirappalli': 'tiruchirappalli',
  'trichy': 'tiruchirappalli',
  'तिरुचिरापल्ली': 'tiruchirappalli',
  'తిరుచिरాపల్లి': 'tiruchirappalli',
  'তিরুচিরাপল্লি': 'tiruchirappalli',
  'ತಿರುವ್ಚಿರಾಪಳ್ಳಿ': 'tiruchirappalli',

  // Jodhpur
  'jodhpur': 'jodhpur',
  'जोधपुर': 'jodhpur',
  'జోధ్‌పూర్': 'jodhpur',
  'জোধপুর': 'jodhpur',
  'ಜೋಧ್ಪುರ': 'jodhpur',

  // Udaipur
  'udaipur': 'udaipur',
  'उदयपुर': 'udaipur',
  'ఉదయ్‌పూర్': 'udaipur',
  'উদয়পুর': 'udaipur',
  'ಉದಯ್ಪುರ': 'udaipur',

  // Amritsar
  'amritsar': 'amritsar',
  'अमृतसर': 'amritsar',
  'అమృతసర్': 'amritsar',
  'অমৃতসর': 'amritsar',
  'ಅಮೃತಸರ': 'amritsar',

  // Ludhiana
  'ludhiana': 'ludhiana',
  'लुधियाना': 'ludhiana',
  'లుధియానా': 'ludhiana',
  'লুধিয়ানা': 'ludhiana',
  'ಲುದ್ಧಿಯಾನಾ': 'ludhiana',

  // Meerut
  'meerut': 'meerut',
  'मेरठ': 'meerut',
  'మేరట్': 'meerut',
  'মেরঠ': 'meerut',
  'ಮೇರಟ್': 'meerut',

  // Varanasi
  'varanasi.': 'varanasi',
  'banaras': 'varanasi',
  'वाराणसी': 'varanasi',
  'काशी': 'varanasi',
  'వారణాసి': 'varanasi',
  'বারাণসী': 'varanasi',
  'ವಾರಾಣಸಿ': 'varanasi'
};