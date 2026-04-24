/**
 * routes/verifyDocRoute.js
 *
 * Mount in index.js / app.js:
 *   const verifyDocRoute = require('./routes/verifyDocRoute');
 *   app.use('/api', verifyDocRoute);
 *
 * .env format (all on ONE line):
 *   GOOGLE_VISION_KEY_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n",...}
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import vision from '@google-cloud/vision';

const router = express.Router();

// ─────────────────────────────────────────────
// Google Vision Client — handles .env quirks
// ─────────────────────────────────────────────
let visionClient;

try {
  const raw = process.env.GOOGLE_VISION_KEY_JSON;

  if (raw) {
    // dotenv sometimes double-escapes \n → \\n in private_key
    // We fix that before parsing
    const fixedRaw = raw.replace(/\\\\n/g, '\\n'); // fix double-escaped newlines
    const credentials = JSON.parse(fixedRaw);

    // Also fix private_key in case it still has literal \n strings
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    visionClient = new vision.ImageAnnotatorClient({ credentials });
    console.log('[verifyDoc] ✅ Google Vision ready. Project:', credentials.project_id);

  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Local: set GOOGLE_APPLICATION_CREDENTIALS=./path/to/key.json
    visionClient = new vision.ImageAnnotatorClient();
    console.log('[verifyDoc] ✅ Google Vision ready via credentials file.');

  } else {
    console.warn('[verifyDoc] ⚠️  GOOGLE_VISION_KEY_JSON not set in .env');
  }

} catch (err) {
  console.error('[verifyDoc] ❌ Failed to init Google Vision:', err.message);
  console.error('→ Make sure GOOGLE_VISION_KEY_JSON is valid JSON on a SINGLE line in .env');
}

// ─────────────────────────────────────────────
// Multer — save uploaded file temporarily
// ─────────────────────────────────────────────
const tempUploadDir = path.resolve(process.cwd(), 'uploads', 'verify-tmp');
fs.mkdirSync(tempUploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, tempUploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `id-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, or WEBP images are supported.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ─────────────────────────────────────────────
// parseIdText — extract name, docType, ID number
// ─────────────────────────────────────────────
function parseIdText(rawText) {
  const text  = rawText || '';
  const upper = text.toUpperCase();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Detect document type
  let docType = null;
  if (upper.includes('AADHAAR') || upper.includes('AADHAR') || upper.includes('UIDAI') || upper.includes('UNIQUE IDENTIFICATION')) {
    docType = 'Aadhaar';
  } else if (upper.includes('INCOME TAX DEPARTMENT') || upper.includes('PERMANENT ACCOUNT NUMBER') || /\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(text)) {
    docType = 'PAN';
  } else if (upper.includes('ELECTION COMMISSION') || upper.includes('ELECTORS PHOTO') || upper.includes('VOTER')) {
    docType = 'Voter ID';
  } else if (upper.includes('PASSPORT') || (upper.includes('REPUBLIC OF INDIA') && upper.includes('NATIONALITY'))) {
    docType = 'Passport';
  } else if (upper.includes('DRIVING LICENCE') || upper.includes('DRIVING LICENSE') || upper.includes('MOTOR VEHICLES')) {
    docType = 'Driving Licence';
  }

  // 2. Validate ID number
  let idNumber = null, maskedNumber = null, idValid = false;
  if (docType === 'Aadhaar') {
    const m = text.match(/\b(\d{4})\s?(\d{4})\s?(\d{4})\b/);
    if (m) { idNumber = `${m[1]} ${m[2]} ${m[3]}`; maskedNumber = `XXXX XXXX ${m[3]}`; idValid = true; }
  } else if (docType === 'PAN') {
    const m = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
    if (m) { idNumber = m[1]; maskedNumber = `${m[1].slice(0,5)}XXXX${m[1].slice(-1)}`; idValid = true; }
  } else if (docType === 'Voter ID') {
    const m = text.match(/\b([A-Z]{3}[0-9]{7})\b/);
    if (m) { idNumber = m[1]; maskedNumber = `${m[1].slice(0,3)}XXXX${m[1].slice(-3)}`; idValid = true; }
  } else if (docType === 'Passport') {
    const m = text.match(/\b([A-Z][0-9]{7})\b/);
    if (m) { idNumber = m[1]; maskedNumber = `${m[1][0]}XXXXXX${m[1].slice(-1)}`; idValid = true; }
  } else if (docType === 'Driving Licence') {
    const m = text.match(/\b([A-Z]{2}[\s\-]?\d{2}[\s\-]?\d{4}[\s\-]?\d{7})\b/);
    if (m) { idNumber = m[1]; maskedNumber = `${m[1].slice(0,4)}XXXXXX${m[1].slice(-3)}`; idValid = true; }
  }

  // 3. Extract name — 4 strategies
  let name = null;

  // A: "Name:" / "नाम:" label
  const nameLabelPats = [
    /(?:^|\n)\s*(?:Name|नाम)\s*[:\-]\s*([A-Za-z][A-Za-z\s\.]{2,40})/im,
    /(?:^|\n)\s*(?:S\/O|D\/O|W\/O|Son of|Daughter of|Wife of)\s*[:\-]?\s*([A-Za-z][A-Za-z\s\.]{2,40})/im,
  ];
  for (const pat of nameLabelPats) {
    const m = text.match(pat);
    if (m?.[1]?.trim()) { name = m[1].trim().replace(/\s{2,}/g, ' '); break; }
  }

  // B: Aadhaar — name is the line just ABOVE the DOB line
  if (!name && docType === 'Aadhaar') {
    for (let i = 1; i < lines.length; i++) {
      const isDob = /\b(DOB|Date of Birth|Year of Birth|YOB|जन्म)\b/i.test(lines[i]) ||
                    /\b\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}\b/.test(lines[i]);
      if (isDob && /^[A-Z][a-zA-Z\s\.]{3,35}$/.test(lines[i - 1])) {
        name = lines[i - 1]; break;
      }
    }
  }

  // C: PAN — ALL CAPS line, not a keyword
  if (!name && docType === 'PAN') {
    const skip = ['INCOME TAX', 'PERMANENT ACCOUNT', 'GOVT', 'INDIA', 'DEPARTMENT', 'भारत'];
    for (const line of lines) {
      if (/^[A-Z][A-Z\s]{4,35}$/.test(line) && !skip.some(s => line.toUpperCase().includes(s))) {
        name = line; break;
      }
    }
  }

  // D: Generic fallback — ALL CAPS 2–5 word line
  if (!name) {
    const skip = ['GOVERNMENT','INDIA','AADHAAR','AADHAR','ELECTION','COMMISSION','DRIVING',
      'LICENCE','LICENSE','VOTER','PASSPORT','INCOME','PERMANENT','ACCOUNT','UIDAI',
      'REPUBLIC','DEPARTMENT','AUTHORITY','IDENTIFICATION','UNIQUE'];
    for (const line of lines) {
      const words = line.split(/\s+/);
      if (/^[A-Z][A-Z\s\.]{4,40}$/.test(line) && words.length >= 2 && words.length <= 5 &&
          !skip.some(s => line.toUpperCase().includes(s))) {
        name = line; break;
      }
    }
  }

  // 4. Extract DOB
  let dob = null;
  const dobMatch =
    text.match(/(?:DOB|Date of Birth|D\.O\.B|जन्म तिथि|Year of Birth)\s*[:\-]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i) ||
    text.match(/\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/);
  if (dobMatch) dob = dobMatch[1];

  // 5. Extract gender
  let gender = null;
  if (/\b(MALE|पुरुष)\b/i.test(text)) gender = 'Male';
  else if (/\b(FEMALE|महिला|स्त्री)\b/i.test(text)) gender = 'Female';

  const authorized = !!(docType && idValid);

  return {
    authorized,
    docType:      docType      || 'Unknown',
    name:         name         || null,
    maskedNumber: maskedNumber || null,
    dob:          dob          || null,
    gender:       gender       || null,
    idValid,
    reason: authorized ? null
      : !docType  ? 'No valid Indian government ID detected.'
      : 'ID type detected but number could not be validated. Try a clearer image.',
  };
}

// ─────────────────────────────────────────────
// POST /api/verify-doc
// ─────────────────────────────────────────────
router.post('/verify-doc', upload.single('file'), async (req, res) => {
  console.log('[verify-doc] request received:', { file: req.file?.originalname, size: req.file?.size });
  const filePath = req.file?.path;
  const cleanup  = () => { if (filePath) fs.unlink(filePath, () => {}); };

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  if (!visionClient) {
    cleanup();
    return res.status(500).json({
      success: false,
      message: 'Google Vision API not configured. Add GOOGLE_VISION_KEY_JSON to your .env file (as a single line).',
    });
  }

  try {
    // documentTextDetection is best for dense text like ID cards
    const [result] = await visionClient.documentTextDetection(filePath);
    const rawText  = result.fullTextAnnotation?.text || '';

    if (!rawText.trim()) {
      cleanup();
      return res.status(200).json({
        success: false,
        message: 'Could not read text. Please upload a clear, well-lit photo of your ID.',
      });
    }

    const parsed = parseIdText(rawText);
    cleanup();

    return res.status(200).json({
      success:         parsed.authorized,
      extractedName:   parsed.name,
      detectedDocType: parsed.docType,
      maskedIdNumber:  parsed.maskedNumber,
      dob:             parsed.dob,
      gender:          parsed.gender,
      idValid:         parsed.idValid,
      message: parsed.authorized
        ? `✅ ${parsed.docType} verified. Name: ${parsed.name || 'extracted'}`
        : `❌ ${parsed.reason}`,
    });

  } catch (err) {
    cleanup();
    console.error('[verify-doc] Error:', err);
    const billingError = err.message?.toLowerCase().includes('billing') || err.details?.toLowerCase().includes('billing');
    if (billingError) {
      return res.status(500).json({
        success: false,
        message: 'Google Vision: billing is not enabled for this project. Enable Cloud Billing and retry.',
        debug: {
          code: err.code,
          message: err.message,
          details: err.details || err.stack,
        },
      });
    }
    if (err.code === 7 || err.message?.includes('PERMISSION_DENIED')) {
      return res.status(500).json({
        success: false,
        message: 'Google Vision: Permission denied. Check your service account has Vision API access.',
        debug: {
          code: err.code,
          message: err.message,
          details: err.details || err.stack,
        },
      });
    }
    if (err.code === 8 || err.message?.includes('quota')) {
      return res.status(429).json({ success: false, message: 'Google Vision quota exceeded (1000 free/month).' });
    }
    return res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File too large. Max 5MB.' });
  if (err) return res.status(400).json({ success: false, message: err.message });
  next();
});

export default router;
