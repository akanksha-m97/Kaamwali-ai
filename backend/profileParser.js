const CITY_KEYWORDS = [
  'bhiwani',
  'delhi',
  'jaipur',
  'mumbai',
  'pune',
  'ajmer',
  'jabalpur'
];

const SKILL_KEYWORDS = {
  cooking: ['cooking', 'cook', 'khana', 'khana banana', 'rasoi'],
  cleaning: ['safai', 'jhadu', 'pochha', 'cleaning'],
  babysitting: ['baby', 'bachcha', 'child care', 'bachon'],
  elderly: ['buzurg', 'elder', 'old age', 'elder care'],
  housekeeping: ['ghar ka kaam', 'housekeeping']
};

export function normalizeText(text) {
  return (text || '').toLowerCase();
}

export function parseName(text) {
  const t = normalizeText(text);
  const m = t.match(/mera naam ([a-z\u0900-\u097f\s]+?) hai/);
  if (!m) return null;

  return m[1]
    .trim()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

export function parseCityArea(text) {
  const t = normalizeText(text);

  for (const city of CITY_KEYWORDS) {
    if (t.includes(city)) {
      return city[0].toUpperCase() + city.slice(1);
    }
  }

  const m = t.match(/mein ([a-z\u0900-\u097f\s]+?) rehti hoon/);
  if (m) return m[1].trim();

  return null;
}

export function parseAge(text) {
  const t = normalizeText(text);
  const m = t.match(/(\d+)\s*(saal|years|year)/);
  if (m) return parseInt(m[1], 10);
  return null;
}

export function parseExperienceYears(text) {
  const t = normalizeText(text);
  const m = t.match(/(\d+)\s*saal/);
  if (m) return parseInt(m[1], 10);
  return null;
}

export function parseSkills(text) {
  const t = normalizeText(text);
  const skills = [];
  for (const [skill, words] of Object.entries(SKILL_KEYWORDS)) {
    if (words.some((w) => t.includes(w))) skills.push(skill);
  }
  return skills;
}

export function parseExpectedSalary(text) {
  const t = normalizeText(text);
  let m = t.match(/(\d{3,6})/);
  if (m) return parseInt(m[1], 10);

  m = t.match(/(\d+)\s*(hazaar|hazar|thousand|k)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n)) return n * 1000;
  }
  return null;
}

export function parseAvailability(text) {
  const t = normalizeText(text);
  const result = {
    morning: false,
    afternoon: false,
    evening: false,
    days: null
  };

  if (t.includes('subah') || t.includes('morning')) result.morning = true;
  if (t.includes('dopahar') || t.includes('afternoon')) result.afternoon = true;
  if (t.includes('shaam') || t.includes('evening')) result.evening = true;

  if (t.includes('mon') || t.includes('monday')) result.days = 'Mon–Sat';
  if (t.includes('saturday') || t.includes('sunday')) result.days = 'Mon–Sun';

  return result;
}

export function extractInitialDraft(rawText) {
  const name = parseName(rawText);
  const cityArea = parseCityArea(rawText);
  const age = parseAge(rawText);
  const experienceYears = parseExperienceYears(rawText);
  const skills = parseSkills(rawText);
  const expectedSalary = parseExpectedSalary(rawText);
  const availability = parseAvailability(rawText);

  const draft = {
    name: name || null,
    cityArea: cityArea || null,
    age: age || null,
    experienceYears: experienceYears || null,
    skills: skills.length ? skills : [],
    expectedSalary: expectedSalary || null,
    availability,
    emergencyContact: null,
    comfortableWithFamilies: null,
    comfortableWithPets: null,
    // NEW FIELDS
    workType: null,
    daysOff: null,
    medicalConditions: null,
    willingLateOrTravel: null,
    previousEmployerRef: null,
    rawSegments: [rawText]
  };

  return {
    draft,
    missingFields: computeMissingFields(draft)
  };
}

export function updateDraftWithField(draft, field, answerText) {
  const newDraft = {
    ...draft,
    rawSegments: [...(draft.rawSegments || []), answerText]
  };

  switch (field) {
    case 'name': {
      const fromParser = parseName(answerText);
      newDraft.name = fromParser || answerText.trim() || newDraft.name;
      break;
    }
    case 'cityArea': {
      const city = parseCityArea(answerText);
      newDraft.cityArea = city || answerText.trim() || newDraft.cityArea;
      break;
    }
    case 'age': {
      const ageParsed = parseAge(answerText);
      if (ageParsed) {
        newDraft.age = ageParsed;
      } else {
        const m = answerText.match(/(\d+)/);
        if (m) {
          newDraft.age = parseInt(m[1], 10);
        } else {
          newDraft.age = newDraft.age || 0;
        }
      }
      break;
    }
    case 'experienceYears': {
      const exp = parseExperienceYears(answerText);
      if (exp) newDraft.experienceYears = exp;
      else {
        const m = answerText.match(/(\d+)/);
        if (m) newDraft.experienceYears = parseInt(m[1], 10);
      }
      break;
    }
    case 'skills': {
      const sk = parseSkills(answerText);
      if (sk.length) newDraft.skills = sk;
      else if (!newDraft.skills || newDraft.skills.length === 0) {
        newDraft.skills = [answerText.trim()];
      }
      break;
    }
    case 'expectedSalary': {
      const sal = parseExpectedSalary(answerText);
      if (sal) newDraft.expectedSalary = sal;
      else {
        const m = answerText.match(/(\d{3,6})/);
        if (m) newDraft.expectedSalary = parseInt(m[1], 10);
      }
      break;
    }
    case 'availability': {
      const avail = parseAvailability(answerText);
      newDraft.availability = {
        morning: true,
        afternoon: true,
        evening: true,
        days: 'Flexible',
        ...avail
      };
      break;
    }
    case 'emergencyContact': {
      newDraft.emergencyContact = answerText.trim() || newDraft.emergencyContact;
      break;
    }
    case 'comfortableWithFamilies': {
      newDraft.comfortableWithFamilies =
        answerText.trim() || newDraft.comfortableWithFamilies;
      break;
    }
    case 'comfortableWithPets': {
      newDraft.comfortableWithPets =
        answerText.trim() || newDraft.comfortableWithPets;
      break;
    }
    case 'workType': {
      newDraft.workType = answerText.trim() || newDraft.workType;
      break;
    }
    case 'daysOff': {
      newDraft.daysOff = answerText.trim() || newDraft.daysOff;
      break;
    }
    case 'medicalConditions': {
      newDraft.medicalConditions = answerText.trim() || newDraft.medicalConditions;
      break;
    }
    case 'willingLateOrTravel': {
      newDraft.willingLateOrTravel =
        answerText.trim() || newDraft.willingLateOrTravel;
      break;
    }
    case 'previousEmployerRef': {
      newDraft.previousEmployerRef =
        answerText.trim() || newDraft.previousEmployerRef;
      break;
    }
    default:
      break;
  }

  return {
    draft: newDraft,
    missingFields: computeMissingFields(newDraft)
  };
}

export function computeMissingFields(draft) {
  const missing = [];

  if (draft.name == null || draft.name === '') missing.push('name');
  if (draft.cityArea == null || draft.cityArea === '') missing.push('cityArea');
  if (draft.age == null) missing.push('age');
  if (draft.experienceYears == null) missing.push('experienceYears');
  if (!draft.skills || draft.skills.length === 0) missing.push('skills');
  if (!draft.expectedSalary) missing.push('expectedSalary');

  if (!draft.emergencyContact) missing.push('emergencyContact');
  if (draft.comfortableWithFamilies == null) missing.push('comfortableWithFamilies');
  if (draft.comfortableWithPets == null) missing.push('comfortableWithPets');

  // NEW REQUIRED FIELDS
  if (!draft.workType) missing.push('workType');
  if (!draft.daysOff) missing.push('daysOff');
  if (!draft.medicalConditions) missing.push('medicalConditions');
  if (!draft.willingLateOrTravel) missing.push('willingLateOrTravel');
  if (!draft.previousEmployerRef) missing.push('previousEmployerRef');

  return missing;
}

export function calculateTrustScore(draft) {
  let score = 40;
  if (draft.experienceYears) score += Math.min(30, draft.experienceYears * 4);
  if (draft.skills && draft.skills.length > 0) score += 10;
  if (draft.cityArea) score += 5;
  if (draft.expectedSalary) score += 5;
  if (draft.availability && draft.availability.days) score += 5;
  return Math.min(95, score);
}
