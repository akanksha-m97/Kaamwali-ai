// backend/index.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import generateWorkerPDF from './generateWorkerPDF.js';
import {
  extractInitialDraft,
  updateDraftWithField,
  calculateTrustScore
} from './profileParser.js';
import { connectDB } from './db.js';
import i18nRouter from './routes/i18n.js';
import verifyDocRoute from './VerifydocRoute.js';
import { CITY_MAP } from './cityMap.js';
import Sentiment from 'sentiment';  // [web:43]
import { createWorker } from 'tesseract.js';
import rateLimit from 'express-rate-limit';

const sentiment = new Sentiment();

function getWorkerLookupFilter(phone) {
  return {
    $or: [
      { emergencyContact: phone },
      { 'safety.emergencyContact': phone },
    ],
  };
}

async function sendSafetySms(to, body) {
  if (!to || !body) {
    return { sent: false, reason: 'missing_recipient_or_body' };
  }

  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER,
  } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.warn('Twilio env vars missing, skipping safety SMS');
    return { sent: false, reason: 'missing_twilio_config' };
  }

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const response = await client.messages.create({
      body,
      to,
      from: TWILIO_FROM_NUMBER,
    });

    return { sent: true, sid: response.sid };
  } catch (err) {
    console.error('Safety SMS send failed:', err);
    return { sent: false, reason: err.message };
  }
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ------------------ OCR HELPERS ------------------ */

async function extractTextFromImage(imagePath) {
  try {
    const worker = await createWorker();
    const { data: { text } } = await worker.recognize(imagePath);
    await worker.terminate();
    return text;
  } catch (err) {
    console.error('OCR error:', err);
    return null;
  }
}

async function extractTextFromPdf(pdfPath) {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (err) {
    console.error('PDF extraction error:', err);
    return null;
  }
}

/* Aadhaar validation helper */
async function isValidAadhaarNumber(str) {
  const regex = /^[2-9]\d{3}\s?\d{4}\s?\d{4}$|^[2-9]\d{11}$/;
  return regex.test(str);
}

/* Layout-based name extraction for Aadhaar OCR */
function extractNameFromAadhaarText(text) {
  try {
    if (!text) {
      console.error('\u274c extractNameFromAadhaarText: text is null/undefined');
      return null;
    }

    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    console.log('\ud83d\udd0d Name extraction: found', lines.length, 'non-empty lines');

    if (lines.length === 0) {
      console.error('\u274c extractNameFromAadhaarText: no lines after split');
      return null;
    }

    // Look for lines containing DOB or Date of Birth
    const dobLineIndex = lines.findIndex(line =>
      /dob|date of birth/i.test(line)
    );

    if (dobLineIndex >= 0) {
      const dobLine = lines[dobLineIndex];
      console.log('\ud83d\udd0d Name extraction: DOB line found at index', dobLineIndex, ':', dobLine);

      // Extract name from the DOB line (before DOB)
      const nameMatch = dobLine.match(/^([^|\/]*?)\s*[|\/]\s*.*?(?:dob|date of birth)/i);
      if (nameMatch) {
        const extractedName = nameMatch[1].trim();
        console.log('\ud83d\udd0d Name extraction: extracted from DOB line:', extractedName);
        return extractedName;
      }

      // If no match, check the previous line
      if (dobLineIndex > 0) {
        const prevLine = lines[dobLineIndex - 1];
        console.log('\ud83d\udd0d Name extraction: checking previous line:', prevLine);
        if (prevLine && prevLine.length > 2 && !/\d{4}/.test(prevLine)) { // Not a year
          return prevLine;
        }
      }
    }

    // Fallback: Try to find line containing UIDAI / Aadhaar header
    const headerIndex = lines.findIndex(line =>
      /uidai|unique identification authority|aadhaar/i.test(line)
    );

    console.log('\ud83d\udd0d Name extraction: header found at index', headerIndex);

    // If no header found, return null
    if (headerIndex < 0) {
      console.error('\u274c extractNameFromAadhaarText: no UIDAI/Aadhaar header found');
      return null;
    }

    // Name is usually 1–3 lines after the header
    const candidateLines = [];
    for (let offset = 1; offset <= 3; offset++) {
      const idx = headerIndex + offset;
      if (idx >= 0 && idx < lines.length) {
        candidateLines.push(lines[idx]);
      }
    }

    console.log('\ud83d\udd0d Name extraction: candidate lines:', candidateLines);

    // Filter out lines that clearly look like numbers / Aadhaar / DOB / gender
    const filtered = candidateLines.filter(line => {
      // Many digits → probably Aadhaar number or DOB, skip
      const digitRatio = (line.replace(/\D/g, '').length / line.length);
      if (digitRatio > 0.4) return false;

      // Skip lines with metadata
      if (/male|female|dob|date of birth|year|age/i.test(line)) return false;
      if (/to\s+be\s+used|government of india|भारत सरकार/i.test(line)) return false;

      return true;
    });

    console.log('\ud83d\udd0d Name extraction: filtered candidates:', filtered);

    if (filtered.length === 0) {
      console.error('\u274c extractNameFromAadhaarText: no valid name candidates after filtering');
      return null;
    }

    // Take the first non-numeric, non-DOB candidate as name
    const extractedName = filtered[0];
    console.log('\ud83d\udd0d Name extraction: returning:', extractedName);
    return extractedName;
  } catch (err) {
    console.error('\u274c Name extraction error:', err);
    return null;
  }
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api', i18nRouter);
app.use('/api', verifyDocRoute);

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/send-otp', otpLimiter);
app.use('/api/send-emergency-otp', otpLimiter);

/* ------------------ FILE UPLOADS ------------------ */

app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'backend/backend/uploads'))
);

const uploadsDir = path.join(process.cwd(), 'backend/backend/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer for file uploads
import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const verificationDir = path.join(uploadsDir, 'verification');
    if (!fs.existsSync(verificationDir)) {
      fs.mkdirSync(verificationDir, { recursive: true });
    }
    cb(null, verificationDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${Date.now()}${ext}`);
  },
});

// ✅ IMPORTANT: Create upload instance BEFORE any routes use it
const upload = multer({ storage });

// Separate endpoint for just uploading verification file (returns fileUrl)
app.post('/api/upload/verification', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('Upload verification missing file, body:', req.body);
      return res.status(400).json({
        error: 'File is missing',
        message: 'No file received in /api/upload/verification',
      });
    }

    const fileUrl = `/uploads/verification/${req.file.filename}`;
    console.log('✅ Uploaded file:', { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size });
    console.log('✅ Sending fileUrl:', fileUrl, 'form data fields:', req.body);

    res.json({
      fileUrl,
      message: 'Verification file uploaded successfully',
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({
      error: 'Upload failed',
      message: 'Backend upload error',
    });
  }
});

/* ============ COMBINED UPLOAD + VERIFICATION ENDPOINT ============ */
app.post('/api/worker/upload-verify', upload.single('document'), async (req, res) => {
  try {
    console.log('🔍 /api/worker/upload-verify body:', req.body);
    console.log('🔍 /api/worker/upload-verify file:', req.file?.filename);

    const { workerPhone, docType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: 'missing_file',
        message: 'No document file was uploaded',
      });
    }

    if (!workerPhone || !docType) {
      return res.status(400).json({
        error: 'missing_params',
        message: 'workerPhone and docType are required',
      });
    }

    const fileUrl = `/uploads/verification/${req.file.filename}`;
    const filePath = path.join(uploadsDir, 'verification', req.file.filename);

    console.log('🔍 File received:', { fileName: req.file.filename, filePath, docType, workerPhone });

    // Extract text from uploaded file
    let text = null;
    const fileExt = path.extname(req.file.filename).toLowerCase();

    if (['.jpg', '.jpeg', '.png'].includes(fileExt)) {
      console.log('🔍 Running OCR on image...');
      text = await extractTextFromImage(filePath);
    } else if (fileExt === '.pdf') {
      console.log('🔍 Extracting text from PDF...');
      text = await extractTextFromPdf(filePath);
    } else {
      return res.status(400).json({
        error: 'unsupported_file_type',
        message: 'Only JPG, PNG, and PDF files are supported',
      });
    }

    if (!text || text.length === 0) {
      console.error('❌ OCR extraction returned empty text');
      return res.status(400).json({
        error: 'ocr_failed',
        message: 'Could not extract text from document. Try a clearer image.',
      });
    }

    console.log('✅ OCR text extracted, length:', text.length);
    console.log('🔍 Text preview:', text.substring(0, 300));

    // Check if it's a government ID
    const isGovId = text.includes('UIDAI') ||
      text.includes('Unique Identification Authority') ||
      text.includes('Aadhaar') ||
      text.includes('Voter') ||
      text.includes('Election Commission');

    if (!isGovId && docType === 'id') {
      console.error('❌ Document not recognized as government ID');
      return res.status(400).json({
        error: 'invalid_document',
        message: 'Document does not appear to be a government-issued ID',
        debug: { textPreview: text.substring(0, 500) },
      });
    }

    // Extract name
    let idName = extractNameFromAadhaarText(text) || null;
    console.log('🔍 Extracted name:', idName);

    // allow verification even if name is not extracted
    if (!idName) {
      console.warn(
        'Name extraction failed for workerPhone:',
        workerPhone,
        'Text preview:',
        text.substring(0, 300)
      );
      // Optional: fall back to existing name or leave null
      // idName = existingWorker?.idName || null;
    }

    // Extract Aadhaar number if it's an ID
    let aadhaarNumber = null;
    let idDocType = 'unknown';

    if (docType === 'id') {
      // Try to extract 12-digit Aadhaar
      const aadhaarText = text.replace(/[ \n]/g, '');
      const aadhaarBlocks = aadhaarText.match(/\d{12}/g);

      if (aadhaarBlocks) {
        for (const block of aadhaarBlocks) {
          if (await isValidAadhaarNumber(block)) {
            aadhaarNumber = block;
            console.log('🔍 Found valid Aadhaar:', aadhaarNumber);
            break;
          }
        }
      }

      // Determine doc type
      if (text.includes('UIDAI') || text.includes('Aadhaar')) {
        idDocType = 'aadhaar';
      } else if (text.includes('Voter')) {
        idDocType = 'voter';
      } else if (text.includes('Driving') || text.includes('Licence')) {
        idDocType = 'dl';
      }
    }

    // Update worker with verification data
    const filter = {
      $or: [
        { emergencyContact: workerPhone },
        { 'safety.emergencyContact': workerPhone },
      ],
    };

    const updateData = {
      $set: {
        verificationLevel: docType === 'police' ? 'police' : 'id',
        idName,
        idDocType,
        idVerifiedAt: new Date().toISOString(),
        verificationDocs: [
          {
            type: docType,
            url: fileUrl,
            uploadedAt: new Date().toISOString(),
            ...(aadhaarNumber && { aadhaarNumber }),
          },
        ],
      },
    };

    console.log('🔍 Updating worker:', { filter, updateData });

    const updateResult = await workersCollection.updateOne(filter, updateData);
    console.log('🔍 Update result:', updateResult);

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        error: 'worker_not_found',
        message: `No worker found for phone: ${workerPhone}`,
      });
    }

    // Return success with extracted data
    res.json({
      success: true,
      message: 'Document verified successfully',
      idName,
      idDocType,
      aadhaarNumber,
      verificationLevel: docType === 'police' ? 'police' : 'id',
      fileUrl,
    });

  } catch (err) {
    console.error('❌ /api/worker/upload-verify error:', err);
    res.status(500).json({
      error: 'verification_failed',
      message: 'Backend error during verification processing',
      debug: req.query.debug === 'true' ? { stack: err.stack, message: err.message } : undefined,
    });
  }
});

/* ============ LEGACY ENDPOINTS (kept for backward compatibility) ============ */

// Separate endpoint for marking verification (after file upload)
app.post('/api/worker/verify', async (req, res) => {
  try {
    const debugMode = req.query.debug === 'true';
    console.log('🔍 /api/worker/verify body:', req.body);
    console.log('🔍 /api/worker/verify body type:', typeof req.body);
    console.log('🔍 /api/worker/verify query:', req.query);

    // Safely extract params
    const workerPhone = req.body?.workerPhone;
    const docType = req.body?.docType;
    const fileUrl = req.body?.fileUrl;

    console.log('🔍 Extracted params:', { 
      workerPhone, 
      docType, 
      fileUrl, 
      workerPhoneType: typeof workerPhone,
      docTypeType: typeof docType,
      fileUrlType: typeof fileUrl 
    });

    if (!workerPhone || !docType || !fileUrl) {
      console.error('❌ Missing required fields:', { 
        workerPhone: !!workerPhone, 
        docType: !!docType, 
        fileUrl: !!fileUrl 
      });
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Missing workerPhone, docType, or fileUrl',
        debug: debugMode ? { received: req.body, keys: Object.keys(req.body || {}) } : undefined,
      });
    }

    // Match worker by either top‑level or nested emergencyContact
    const filter = {
      $or: [
        { emergencyContact: workerPhone },
        { 'safety.emergencyContact': workerPhone },
      ],
    };

    const worker = await workersCollection.findOne(filter);
    if (!worker) {
      console.error('Worker not found for phone:', workerPhone);
      return res.status(404).json({
        error: 'Worker not found',
        message: 'Worker not found for this phone',
      });
    }

    // For ID verification, extract text and validate
    let idName = null;
    let idLocation = null;
    let idDocType = null;
    let aadhaarNumber = null;

    if (docType === 'id') {
      // Get the file path from the URL
      const fileName = fileUrl.split('/').pop();
      const filePath = path.join(uploadsDir, 'verification', fileName);

      console.log('🔍 ID verification - fileName:', fileName);
      console.log('🔍 ID verification - filePath:', filePath);
      console.log('🔍 ID verification - file exists:', fs.existsSync(filePath));

      if (!fs.existsSync(filePath)) {
        console.error('❌ File not found at path:', filePath);
        return res.status(400).json({ 
          error: 'Uploaded file not found',
          message: 'File not found at: ' + filePath,
          debug: debugMode ? { fileName, filePath, uploadsDir } : undefined
        });
      }

      // Extract text based on file type
      let text = null;
      const fileExt = path.extname(fileName).toLowerCase();

      console.log('🔍 ID verification - fileExt:', fileExt);

      if (['.jpg', '.jpeg', '.png'].includes(fileExt)) {
        console.log('🔍 Starting image OCR...');
        text = await extractTextFromImage(filePath);
        console.log('🔍 Image OCR returned text length:', text ? text.length : 'null');
      } else if (fileExt === '.pdf') {
        console.log('🔍 Starting PDF extraction...');
        text = await extractTextFromPdf(filePath);
        console.log('🔍 PDF extraction returned text length:', text ? text.length : 'null');
      } else {
        console.error('❌ Unsupported file extension:', fileExt);
        return res.status(400).json({
          error: 'Unsupported file type',
          message: 'Only JPG, PNG, and PDF files are supported',
          debug: debugMode ? { fileExt } : undefined
        });
      }

      if (!text) {
        console.error('❌ OCR text extraction failed for file:', filePath);
        console.error('❌ File ext was:', fileExt);
        return res.status(400).json({
          error: 'Could not read document text',
          message: 'OCR failed to extract text from uploaded document (text is null/empty)',
          debug: debugMode ? { filePath, fileExt } : undefined
        });
      }

      console.log('✅ OCR text length:', text.length, 'for file:', filePath);

      // 1) Check if it looks like an Aadhaar or government ID
      const isGovId = text.includes('UIDAI') ||
        text.includes('Unique Identification Authority of India') ||
        text.includes('Aadhaar No') ||
        text.includes('Aadhaar क्रमांक') ||
        text.includes('Aadhaar') ||
        text.includes('Election Commission') ||
        text.includes('Voter ID');

      console.log('🔍 Government ID check - isGovId:', isGovId);
      console.log('🔍 Text preview:', text.substring(0, 300));

      if (!isGovId) {
        console.error('❌ Document failed gov ID check');
        const debugResponse = {
          error: 'government_id_check_failed',
          message: 'Document does not look like an Aadhaar card or government ID',
          debug: { govIdTextFound: false, extractedTextPreview: text.substring(0, 500) },
        };
        return res.status(400).json(debugResponse);
      }

      // 2) Extract Aadhaar number if present
      const aadhaarText = text.replace(/[ \n]/g, '');
      const aadhaarBlocks = aadhaarText.match(/\d{12}/g);

      console.log('🔍 Aadhaar extraction - blocks found:', aadhaarBlocks ? aadhaarBlocks.length : 0);
      console.log('🔍 Aadhaar extraction - candidate blocks:', aadhaarBlocks);
      
      if (aadhaarBlocks) {
        for (const block of aadhaarBlocks) {
          const isValid = await isValidAadhaarNumber(block);
          console.log('🔍 Validating Aadhaar block:', block, 'isValid:', isValid);
          if (isValid) {
            aadhaarNumber = block.replace(/\s/g, '');
            console.log('🔍 Extracted Aadhaar number:', aadhaarNumber);
            break;
          }
        }
      }

      console.log('🔍 Final Aadhaar number (masked):', aadhaarNumber ? '****' + aadhaarNumber.slice(-4) : 'not found');

      // 3) Extract name using layout-based approach (UIDAI header as reference)
      console.log('\ud83d\udd0d Calling extractNameFromAadhaarText with text length:', text.length);
      idName = extractNameFromAadhaarText(text);
      console.log('\ud83d\udd0d Name extraction result:', { idName });

      if (!idName) {
        console.error('Name extraction failed from OCR text');
        const debugResponse = {
          error: 'name_extraction_failed',
          message: 'Could not find name in Aadhaar text (layout-based)',
          debug: { extractedTextPreview: text.substring(0, 500) },
        };
        return res.status(400).json(debugResponse);
      }

      // Determine document type
      if (text.includes('Aadhaar') || text.includes('UIDAI')) {
        idDocType = 'aadhaar';
      } else if (text.includes('Voter') || text.includes('Election Commission')) {
        idDocType = 'voter';
      } else if (text.includes('Driving') || text.includes('Licence')) {
        idDocType = 'dl';
      } else {
        idDocType = 'other';
      }

      // Extract location if available
      const addrMatch = text.match(/(?:Address|पता|Address Details|Permanent Address)[:\s]+([^\n]+(?:\n[^\n]+)*)/i);
      idLocation = addrMatch ? addrMatch[1].trim().replace(/\n/g, ' ') : null;
    }

    const updateData = {
      $push: {
        verificationDocs: {
          type: docType,
          url: fileUrl,
          uploadedAt: new Date().toISOString(),
          ...(docType === 'id' && { aadhaarNumber }),
        },
      },
    };

    // Set verification level and ID fields
    if (docType === 'police') {
      updateData.$set = {
        verificationLevel: 'police',
        idVerifiedAt: new Date().toISOString()
      };
    } else if (docType === 'id') {
      updateData.$set = {
        verificationLevel: 'id',
        idName,
        idLocation,
        idDocType,
        idVerifiedAt: new Date().toISOString()
      };
    } else {
      updateData.$set = {
        verificationLevel: 'phone',
        idVerifiedAt: new Date().toISOString()
      };
    }

    console.log('\ud83d\udd0d About to update worker with filter:', filter);
    console.log('\ud83d\udd0d Update data:', JSON.stringify(updateData, null, 2));
    
    const updateResult = await workersCollection.updateOne(filter, updateData);
    console.log('\ud83d\udd0d Update result:', updateResult);

    const responseData = {
      message: 'Verification updated successfully',
      verificationLevel: updateData.$set.verificationLevel,
      idName,
      idLocation,
      idDocType
    };

    if (docType === 'id' && aadhaarNumber) {
      responseData.aadhaarNumber = aadhaarNumber;
    }

    res.json(responseData);
  } catch (err) {
    console.error('❌ /api/worker/verify error:', err);
    const debugMode = req.query.debug === 'true';
    res.status(500).json({ 
      error: 'Verification failed',
      message: 'Backend error during verification processing',
      debug: debugMode ? { stack: err.stack, message: err.message } : undefined
    });
  }
});

/* ------------------ PDF generation route (generate on server) ------------------ */

app.post('/api/workers/:id/generate-pdf', async (req, res) => {
  const { id } = req.params;

  console.log('✅ request received for /api/workers/:id/generate-pdf');

  let worker;
  if (workersCollection) {
    worker = await workersCollection.findOne({ _id: new ObjectId(id) });
  } else {
    worker = workers.find(w => String(w._id) === String(id));
  }
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const pdfFilename = `worker_${id}_${timestamp}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFilename);

    // Generate PDF using the template
    await generateWorkerPDF(worker, pdfPath);

    const pdfUrlPath = `/uploads/${pdfFilename}`;

    // Optionally save in DB (but don't overwrite uploadedPdfUrl)
    // await workersCollection.updateOne(
    //   { _id: worker._id },
    //   {
    //     $set: { generatedPdfUrl: pdfUrlPath },
    //   }
    // );

    res.json({ pdfUrl: pdfUrlPath });
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

/* ------------------ PDF file upload route (for workers uploading their own PDFs) ------------------ */

// reuse the same multer instance, but change destination to base uploadsDir
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `uploaded_worker_${req.params.id || 'temp'}_${Date.now()}${ext}`);
  },
});
const uploadPdf = multer({ storage: pdfStorage });

app.post('/api/workers/:id/upload-pdf', uploadPdf.single('file'), async (req, res) => {
  const { id } = req.params;

  console.log('✅ request received for /api/workers/:id/upload-pdf');
  console.log('req.file:', req.file);

  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  let worker;
  if (workersCollection) {
    worker = await workersCollection.findOne({ _id: new ObjectId(id) });
  } else {
    worker = workers.find(w => String(w._id) === String(id));
  }
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  // use req.file.path instead of recomputing path
  const pdfPath = req.file.path;
  const pdfUrlPath = `/uploads/${path.basename(pdfPath)}`;

  // Save uploaded PDF URL in DB
  await workersCollection.updateOne(
    { _id: worker._id },
    {
      $set: { uploadedPdfUrl: pdfUrlPath },
    }
  );

  res.json({ pdfUrl: pdfUrlPath });
});

// keep this to serve static files
app.use('/uploads', express.static(uploadsDir));

/* ------------------ STORES ------------------ */

const workers = [];
const sessions = new Map();
let workersCollection = null;
let usersCollection = null;
let tempOtpCollection = null;
let hireRequestsCollection = null;

/* ------------------ TRUST SCORE HELPERS ------------------ */

// Map text satisfaction -> numeric rating (1-5)
function mapSatisfactionToRating(text) {
  if (!text) return 3;
  const t = String(text).toLowerCase().trim();

  if (['excellent', 'very good', 'outstanding'].includes(t)) return 5;
  if (['good', 'nice'].includes(t)) return 4;
  if (['average', 'ok', 'okay', 'fine'].includes(t)) return 3;
  if (['poor', 'bad'].includes(t)) return 2;
  if (['very poor', 'terrible', 'worst'].includes(t)) return 1;

  return 3;
}

// Validate ratings structure
function validateRatings(ratings) {
  const required = ['overallSatisfaction'];
  for (const key of required) {
    if (!ratings[key]) return false;
  }
  return true;
}

// Compute sentiment from free-text review (improvementSuggestions)
function computeSentimentScore(text) {
  if (!text || !text.trim()) return 0.5;
  const result = sentiment.analyze(text); // [web:43]
  const maxPossible = 10;
  let normalized = result.score / maxPossible;
  if (normalized > 1) normalized = 1;
  if (normalized < -1) normalized = -1;
  return (normalized + 1) / 2;
}

// Recompute Trust Score for a single worker document
async function recomputeWorkerTrust(workerId) {
  if (!workersCollection) return;

  const worker = await workersCollection.findOne({ _id: workerId });
  if (!worker) return;

  // Grace period: ignore workers updated < 5 minutes ago
  if (worker.updatedAt && Date.now() - new Date(worker.updatedAt).getTime() < 5 * 60 * 1000) {
    return; // recent enough, skip
  }

  const feedbacks = worker.feedbacks || [];
  const n = feedbacks.length;

  if (n === 0) {
    await workersCollection.updateOne(
      { _id: workerId },
      {
        $set: {
          trustScore: 0,
          trustMeta: {
            avgRating: 0,
            sentimentScore01: 0.5,
            consistency: 0,
            experience: 0,
            activity: 0,
            reviewsCount: 0,
            rehireProbability: 0,
            cluster: 'average',
          },
        },
      }
    );
    return;
  }

  const ratings = feedbacks.map((f) => f.numericRating || 3);
  const sumRatings = ratings.reduce((s, r) => s + r, 0);
  const avgRating = sumRatings / n;

  const sentiments = feedbacks.map((f) =>
    typeof f.sentimentScore01 === 'number' ? f.sentimentScore01 : 0.5
  );
  const avgSentiment =
    sentiments.reduce((s, v) => s + v, 0) / sentiments.length;

  const mean = avgRating;
  const variance =
    ratings.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / n;
  const maxVar = 2;
  let consistency = 1 - variance / maxVar;
  if (consistency < 0) consistency = 0;
  if (consistency > 1) consistency = 1;

  const yearsExp = Number(worker.experienceYears || 0);
  const experience = Math.min(Math.max(yearsExp, 0), 10) / 10;

  const now = Date.now();
  const halfLifeDays = 90;
  const k =
    Math.log(2) / (halfLifeDays * 24 * 60 * 60 * 1000);
  let activitySum = 0;
  feedbacks.forEach((f) => {
    const ts = f.createdAt ? new Date(f.createdAt).getTime() : now;
    const ageMs = now - ts;
    const weight = Math.exp(-k * ageMs);
    activitySum += weight;
  });
  const activity = Math.min(activitySum / 10, 1);

  const trustScoreRaw =
    avgRating * 20 +
    avgSentiment * 30 +
    consistency * 20 +
    experience * 10 +
    activity * 20;

  const trustScore = Math.max(0, Math.min(trustScoreRaw, 100));

  const baseMeta = {
    avgRating,
    sentimentScore01: avgSentiment,
    consistency,
    experience,
    activity,
    reviewsCount: n,
  };

  const rehireProbability = computeRehireProbability(baseMeta);

  let trustCluster = 'average';
  if (trustScore >= 80 && rehireProbability >= 0.7) trustCluster = 'high';
  else if (trustScore <= 50 && rehireProbability <= 0.4) trustCluster = 'risky';

  const finalMeta = {
    ...baseMeta,
    rehireProbability,
    cluster: trustCluster,
  };

  // Pre-computed ranking bucket for filtering
  let rankingBucket = 'medium';
  if (trustScore >= 80 && (worker.safetyIncidents || 0) === 0) rankingBucket = 'top';
  else if (trustScore <= 50 || (worker.safetyIncidents || 0) >= 1) rankingBucket = 'risky';

  await workersCollection.updateOne(
    { _id: workerId },
    {
      $set: {
        trustScore,
        trustMeta: finalMeta,
        rankingBucket,
        updatedAt: new Date().toISOString(),
      },
      $push: {
        profileHistory: {
          summary: `${worker.name} - Trust: ${trustScore.toFixed(1)}, Reviews: ${n}`,
          trustScore,
          createdAt: new Date().toISOString(),
          source: 'trust_recalc'
        }
      }
    }
  );
}

// logistic + rehiring helpers
function logistic(x) {
  return 1 / (1 + Math.exp(-x));
}

function computeRehireProbability(meta) {
  const {
    avgRating,
    sentimentScore01,
    consistency,
    experience,
    activity,
  } = meta;

  const r = (avgRating - 1) / 4;

  const z =
    2.0 * r +
    1.5 * sentimentScore01 +
    1.0 * consistency +
    0.8 * experience +
    1.2 * activity -
    2.0;

  return logistic(z);
}

function createSessionId() {
  return 'sess_' + Math.random().toString(36).slice(2);
}

/* ------------------ WORKER ONBOARDING ------------------ */

// 1️⃣ Start profile
app.post('/api/profile/start', (req, res) => {
  const { text } = req.body || {};
  const sessionId = createSessionId();

  const { draft, missingFields } = extractInitialDraft(text || '');
  sessions.set(sessionId, draft);

  res.json({ sessionId, draft, missingFields });
});

// 2️⃣ Answer field
app.post('/api/profile/answer', (req, res) => {
  const { sessionId, field, answerText } = req.body || {};

  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(400).json({ error: 'Invalid sessionId' });
  }

  const currentDraft = sessions.get(sessionId);
  const { draft, missingFields } = updateDraftWithField(
    currentDraft,
    field,
    answerText || ''
  );

  sessions.set(sessionId, draft);
  res.json({ sessionId, draft, missingFields });
});

// 3️⃣ Complete profile
function normalizeCity(raw) {
  if (!raw) return '';
  const cleaned = String(raw).toLowerCase().trim();
  const base = cleaned.split(',')[0];
  return CITY_MAP[cleaned] || CITY_MAP[base] || cleaned;
}

function buildSearchKeyEn(draft) {
  const parts = [];

  if (draft.name && /^[\x00-\x7F]+$/.test(draft.name)) {
    parts.push(String(draft.name));
  }

  if (draft.cityArea) parts.push(normalizeCity(draft.cityArea));
  if (draft.city) parts.push(normalizeCity(draft.city));

  if (draft.state && /^[\x00-\x7F]+$/.test(draft.state)) {
    parts.push(String(draft.state));
  }

  if (draft.skills) {
    const skillsArr = Array.isArray(draft.skills)
      ? draft.skills
      : String(draft.skills).split(/[,\s]+/);

    const latinSkills = skillsArr.filter(s => /^[\x00-\x7F]+$/.test(s));
    if (latinSkills.length) {
      parts.push(latinSkills.join(' '));
    }
  }

  if (draft.workType && /^[\x00-\x7F]+$/.test(draft.workType)) {
    parts.push(String(draft.workType));
  }

  if (draft.experienceYears) parts.push(String(draft.experienceYears));
  if (draft.expectedSalary) parts.push(String(draft.expectedSalary));

  return parts
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

app.post('/api/profile/complete', async (req, res) => {
  const { sessionId, draft: directDraft } = req.body || {};

  let draft;
  if (sessionId && sessions.has(sessionId)) {
    draft = sessions.get(sessionId);
  } else if (directDraft) {
    draft = directDraft;
  } else {
    return res.status(400).json({ error: 'Invalid session' });
  }

  const trustScore = calculateTrustScore(draft);

  // Check for existing ID verification and validate name/location
  let existingWorker = null;
  if (draft.emergencyContact) {
    existingWorker = await workersCollection.findOne({
      $or: [
        { emergencyContact: draft.emergencyContact },
        { 'safety.emergencyContact': draft.emergencyContact },
      ],
    });
  }

  // If worker has uploaded ID, validate voice-recorded data against ID
  if (existingWorker?.idName) {
    const voiceName = (draft.name || '').toLowerCase().trim();
    const idName = existingWorker.idName.toLowerCase().trim();

    // Simple name similarity check
    const voiceFirstName = voiceName.split(' ')[0];
    const idFirstName = idName.split(' ')[0];

    if (!voiceName.includes(idFirstName) && !idName.includes(voiceFirstName)) {
      return res.status(400).json({
        error: 'Voice-recorded name does not match government ID name. Please check.',
        hint: 'Make sure you pronounce your full name exactly as written on your ID.',
        idName: existingWorker.idName
      });
    }

    // Optional: location validation
    if (existingWorker.idLocation) {
      const idAddr = existingWorker.idLocation.toLowerCase();
      const workerCity = (draft.city || '').toLowerCase();
      const workerArea = (draft.cityArea || '').toLowerCase();

      if (!idAddr.includes(workerCity) && !idAddr.includes(workerArea) && workerCity && workerArea) {
        console.warn('Location mismatch between ID and voice-recorded data:', {
          idLocation: existingWorker.idLocation,
          voiceCity: draft.city,
          voiceArea: draft.cityArea
        });
        // For now, just log - you can make this stricter later
      }
    }
    // Auto-correct profile name to match ID for consistency
    draft.name = existingWorker.idName;
  }
  const worker = {
    ...draft,
    trustScore,
    trustMeta: {
      avgRating: 0,
      sentimentScore01: 0.5,
      consistency: 0,
      experience: Number(draft.experienceYears || 0),
      activity: 0,
      reviewsCount: 0,
      rehireProbability: 0,
      cluster: 'average',
    },
    // hire status
    isHired: false,
    currentEmployerPhone: null,
    lastHiredAt: null,
    hireHistory: [],
    // VERIFICATION FIELDS (inherit from existing worker if available)
    verificationLevel: existingWorker?.verificationLevel || 'unverified',
    verificationDocs: existingWorker?.verificationDocs || [],
    idName: existingWorker?.idName || null,
    idLocation: existingWorker?.idLocation || null,
    idDocType: existingWorker?.idDocType || null,
    idVerifiedAt: existingWorker?.idVerifiedAt || null,
    emergencyContactPhone: existingWorker?.emergencyContactPhone || null,
    emergencyContactVerified: existingWorker?.emergencyContactVerified || false,
    createdAt: new Date().toISOString(),
    safety: {
      emergencyContactAdded: !!draft.emergencyContact,
      emergencyContact: draft.emergencyContact,
      emergencyContactPhone: existingWorker?.safety?.emergencyContactPhone || null,
      emergencyContactVerified: existingWorker?.safety?.emergencyContactVerified || false,
    },
    searchKey_en: buildSearchKeyEn(draft),
    feedbacks: [],
    feedbackCount: 0
  };
  try {
    if (workersCollection) {
      const result = await workersCollection.insertOne(worker);
      worker._id = result.insertedId;
    } else {
      worker._id = workers.length + 1;
      workers.push(worker);
    }
    if (sessionId) sessions.delete(sessionId);
    res.json({ worker });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save worker' });
  }
});
/* ------------------ EMPLOYER SEARCH ------------------ */
app.get('/api/workers', async (req, res) => {
  const { cityArea, skill, minExp, maxSalary, q, verification } = req.query;
  const query = {};
  if (!q && cityArea) {
    query.$or = [
      { city: { $regex: cityArea, $options: 'i' } },
      { cityArea: { $regex: cityArea, $options: 'i' } }
    ];
  }
  if (skill) {
    query.skills = { $elemMatch: { $regex: skill, $options: 'i' } };
  }
  if (minExp !== undefined && minExp !== '') {
    query.$expr = {
      $gte: [{ $toInt: '$experienceYears' }, Number(minExp)]
    };
  }
  if (maxSalary !== undefined && maxSalary !== '') {
    query.$expr = {
      $lte: [{ $toInt: '$expectedSalary' }, Number(maxSalary)]
    };
  }
  // NEW: verification filter
  if (verification === 'id') {
    query.verificationLevel = { $in: ['id', 'police'] };
  } else if (verification === 'police') {
    query.verificationLevel = 'police';
  }
  // Ranking bucket filter (exclude risky by default)
  if (!req.query.includeRisky) {
    query.rankingBucket = { $ne: 'risky' };
  }
  if (q) {
    const normalizedQ = String(q).toLowerCase().trim();
    if (normalizedQ) {
      query.$or = [
        { searchKey_en: { $regex: normalizedQ, $options: 'i' } },
        { cityArea:     { $regex: normalizedQ, $options: 'i' } },
        { city:         { $regex: normalizedQ, $options: 'i' } }
      ];
    }
  }
  try {
    const users = await usersCollection.find({ role: 'employer' }).toArray();
    const employerMap = {};
    users.forEach((u) => {
      employerMap[u.phone] = u.safetyIncidents || 0;
    });

    const pipeline = [
      { $match: query },
      {
        $addFields: {
          // Compute safety metrics
          excessiveSafetyIncidents: { $gte: [{ $ifNull: ['$safetyIncidents', 0] }, 2] },
          cumulativeSafetyScore: {
            $subtract: [
              100,
              { $multiply: [{ $ifNull: ['$safetyIncidents', 0] }, 20] }
            ]
          },
          // Existing matchScore
          matchScore: {
            $add: [
              { $multiply: ['$trustScore', 0.7] },
              { $cond: { if: { $eq: ['$verificationLevel', 'police'] }, then: 20, else: 0 } },
              { $cond: { if: { $eq: ['$verificationLevel', 'id'] }, then: 10, else: 0 } },
              { $multiply: [{ $divide: ['$experienceYears', 10] }, 5] },
            ],
          },
          // NEW: candidateScore (learned ranking based on hire likelihood)
          candidateScore: {
            $add: [
              { $multiply: ['$trustScore', 0.8] },                          // trust weight
              { $cond: { if: { $gte: ['$matchScore', 80] }, then: 10, else: 0 } }, // strong match bonus
              { $cond: { if: { $eq: ['$verificationLevel', 'police'] }, then: 15, else: 0 } }, // police verification
              { $cond: { if: { $eq: ['$verificationLevel', 'id'] }, then: 8, else: 0 } },      // ID verification
              { $cond: { if: { $gte: ['$experienceYears', 5] }, then: 5, else: 0 } },          // experience
              { $cond: { if: { $gte: ['$feedbackCount', 3] }, then: 8, else: 0 } },           // positive feedback
              { $cond: { if: { $eq: ['$excessiveSafetyIncidents', true] }, then: -50, else: 0 } }, // safety penalty
              { $cond: { if: { $gte: ['$cumulativeSafetyScore', 80] }, then: 10, else: 0 } }  // safety bonus
            ],
          },
        },
      },
      { $sort: { candidateScore: -1, matchScore: -1, trustScore: -1 } },
    ];
    const mongoWorkers = await workersCollection.aggregate(pipeline).toArray();
    const enrichedWorkers = mongoWorkers.map((w) => {
      const employerSafetyIncidents = employerMap[w.currentEmployerPhone] || 0;
      const safetyScore = Math.max(0, 100 - (w.safetyIncidents || 0) * 25);

      return {
        ...w,
        employerSafetyIncidents,
        employerRiskLevel:
          employerSafetyIncidents >= 2
            ? 'HIGH'
            : employerSafetyIncidents === 1
            ? 'MEDIUM'
            : 'LOW',
        safetyScore,
      };
    });

    res.json({ workers: enrichedWorkers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

/* ------------------ USER AUTH ------------------ */

app.post('/api/send-otp', async (req, res) => {
  try {
    const { phone, name, email, city, role } = req.body || {};

    if (!phone) {
      return res.status(400).json({ error: 'Phone required' });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await usersCollection.updateOne(
      { phone },
      {
        $set: {
          otp: hashedOtp,
          otpExpiry: Date.now() + 5 * 60 * 1000,
          isPhoneVerified: false,
        },
        $setOnInsert: {
          phone,
          name: name || '',
          email: email || '',
          city: city || '',
          role: role || 'worker',
          createdAt: new Date(),
          safetyIncidents: 0,
          lastSafetyIncidentDate: null,
          isBlocked: false,
          isIdVerified: false,
          idVerifiedBy: null,
          idVerifiedAt: null,
          isAddressVerified: false,
          addressVerifiedAt: null,
          password: null,
        },
      },
      { upsert: true }
    );

    const smsResult = await sendSafetySms(phone, `Your OTP is ${otp}`);
    if (!smsResult.sent) {
      return res.status(500).json({ error: 'Failed to send OTP', reason: smsResult.reason });
    }

    res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body || {};
    const user = await usersCollection.findOne({ phone });

    if (!user || !user.otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (!user.otpExpiry || Date.now() > user.otpExpiry) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    const isOtpMatch = await bcrypt.compare(otp, user.otp);
    if (!isOtpMatch) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    await usersCollection.updateOne(
      { phone },
      {
        $set: { isPhoneVerified: true },
        $unset: { otp: '', otpExpiry: '' },
      }
    );

    res.json({ message: 'Phone verified' });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

app.post('/api/set-password', async (req, res) => {
  try {
    const { phone, password, role } = req.body || {};

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password required' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await usersCollection.updateOne(
      { phone },
      {
        $set: {
          password: hashed,
          role: role || 'worker',
          isPhoneVerified: true,
        },
        $setOnInsert: {
          name: '',
          email: '',
          city: '',
          createdAt: new Date(),
          safetyIncidents: 0,
          lastSafetyIncidentDate: null,
          isBlocked: false,
          isIdVerified: false,
          idVerifiedBy: null,
          idVerifiedAt: null,
          isAddressVerified: false,
          addressVerifiedAt: null,
        },
      },
      { upsert: true }
    );

    res.json({ message: 'Signup complete' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set password' });
  }
});

app.post('/api/send-emergency-otp', async (req, res) => {
  try {
    const { workerPhone, emergencyPhone } = req.body || {};

    if (!workerPhone || !emergencyPhone) {
      return res.status(400).json({ error: 'Worker phone and emergency phone required' });
    }

    const worker = await workersCollection.findOne(getWorkerLookupFilter(workerPhone));
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    await tempOtpCollection.updateOne(
      { phone: emergencyPhone },
      {
        $set: {
          phone: emergencyPhone,
          workerPhone,
          otp: hashedOtp,
          otpExpiry: Date.now() + 5 * 60 * 1000,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    const smsResult = await sendSafetySms(emergencyPhone, `Your OTP is ${otp}`);
    if (!smsResult.sent) {
      return res.status(500).json({ error: 'Failed to send OTP', reason: smsResult.reason });
    }

    res.json({ message: 'Emergency contact OTP sent' });
  } catch (err) {
    console.error('send-emergency-otp error:', err);
    res.status(500).json({ error: 'Failed to send emergency OTP' });
  }
});

app.post('/api/verify-emergency-contact', async (req, res) => {
  try {
    const { workerPhone, emergencyPhone, otp } = req.body || {};
    const record = await tempOtpCollection.findOne({ phone: emergencyPhone, workerPhone });

    if (!record || !record.otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (!record.otpExpiry || Date.now() > record.otpExpiry) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    const isOtpMatch = await bcrypt.compare(otp, record.otp);
    if (!isOtpMatch) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const updateResult = await workersCollection.updateOne(
      getWorkerLookupFilter(workerPhone),
      {
        $set: {
          emergencyContactPhone: emergencyPhone,
          emergencyContactVerified: true,
          'safety.emergencyContactPhone': emergencyPhone,
          'safety.emergencyContactVerified': true,
        },
      }
    );

    if (!updateResult.matchedCount) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    await tempOtpCollection.deleteOne({ _id: record._id });
    res.json({ message: 'Emergency contact verified' });
  } catch (err) {
    console.error('verify-emergency-contact error:', err);
    res.status(500).json({ error: 'Failed to verify emergency contact' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { phone, password, role } = req.body;

    const user = await usersCollection.findOne({ phone });

    if (!user) {
      return res.status(400).json({ error: 'Phone number not registered' });
    }
    if (!user.isPhoneVerified) {
      return res.status(403).json({
        error: 'Phone not verified',
      });
    }
    if (!user.password) {
      return res.status(400).json({ error: 'Password not set' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Wrong password' });
    }

    if (role && user.role && role !== user.role) {
      return res.status(403).json({
        error: `This phone number is registered as a ${user.role}, not an ${role}.`,
        accountRole: user.role,
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: 'Your account has been blocked due to safety incidents.',
      });
    }

    // Ensure role is always included (fallback to 'worker' if missing)
    const userWithRole = {
      ...user,
      role: user.role || 'worker'
    };

    res.json({ message: 'Login success', user: userWithRole });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

/* ------------------ FEEDBACK SYSTEM ------------------ */

app.post('/api/feedback', async (req, res) => {
  try {
    const {
      employerName,
      date,
      emergencyContact,
      ratings,
      improvementSuggestions
    } = req.body;

    if (!employerName || !emergencyContact || !ratings) {
      return res.status(400).json({
        message: 'Employer name, phone number, and ratings are required'
      });
    }

    if (!validateRatings(ratings)) {
      return res.status(400).json({ message: 'Missing required rating fields' });
    }

    const worker = await workersCollection.findOne({
      $or: [
        { emergencyContact: emergencyContact },
        { 'safety.emergencyContact': emergencyContact }
      ]
    });

    if (!worker) {
      return res.status(404).json({
        message: 'Worker not found with this phone number. Please verify.'
      });
    }

    const numericRating = mapSatisfactionToRating(
      ratings.overallSatisfaction
    );

    const sentimentScore01 = computeSentimentScore(
      improvementSuggestions || ''
    );

    const nowISO = new Date().toISOString();

    const feedback = {
      employerName,
      date: date || nowISO,
      ratings,
      improvementSuggestions: improvementSuggestions || '',
      createdAt: nowISO,
      numericRating,
      sentimentScore01
    };

    await workersCollection.updateOne(
      { _id: worker._id },
      {
        $push: { feedbacks: feedback },
        $inc: { feedbackCount: 1 }
      }
    );

    await recomputeWorkerTrust(worker._id);

    const updatedWorker = await workersCollection.findOne({ _id: worker._id });

    // Log ML event
    await logMlEvent({
      eventType: 'feedback',
      workerId: worker._id,
      employerName,
      numericRating,
      sentiment: sentimentScore01,
      trustScore: updatedWorker.trustScore,
      verificationLevel: worker.verificationLevel || 'none',
      cityArea: worker.cityArea || '',
    });

    res.status(201).json({
      message: 'Feedback submitted successfully!',
      workerName: worker.name,
      trustScore: updatedWorker.trustScore,
      trustMeta: updatedWorker.trustMeta,
      feedback
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/workers/by-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;

    const worker = await workersCollection.findOne(getWorkerLookupFilter(phone));

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json({
      name: worker.name,
      role: worker.role || worker.workType || 'Housekeeper',
      emergencyContact: worker.emergencyContact || worker.safety?.emergencyContact,
      emergencyContactPhone: worker.emergencyContactPhone || worker.safety?.emergencyContactPhone || null,
      emergencyContactVerified: !!(worker.emergencyContactVerified || worker.safety?.emergencyContactVerified),
      isHired: !!worker.isHired,
      currentEmployerPhone: worker.currentEmployerPhone || null,
      currentEmployerName: worker.currentEmployerName || null,
      city: worker.city || null,
      cityArea: worker.cityArea || null,
      verificationLevel: worker.verificationLevel || 'unverified',
    });
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ------------------ WORKER VERIFICATION STATUS DEBUG ------------------ */

app.get('/api/worker/:phone/verify-status', async (req, res) => {
  try {
    const { phone } = req.params;

    const worker = await workersCollection.findOne({
      $or: [
        { emergencyContact: phone },
        { 'safety.emergencyContact': phone }
      ]
    });

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json({
      worker: {
        _id: worker._id,
        name: worker.name,
        phone: worker.emergencyContact,
        verificationLevel: worker.verificationLevel,
        idName: worker.idName,
        idLocation: worker.idLocation,
        idDocType: worker.idDocType,
        idVerifiedAt: worker.idVerifiedAt,
        verificationDocs: worker.verificationDocs,
        trustScore: worker.trustScore,
        rankingBucket: worker.rankingBucket,
      },
      hasIdDoc: worker?.verificationDocs?.length > 0,
      hasAadhaar: !!worker.verificationDocs?.find(d => d.type === 'aadhaar'),
      aadhaarNumber: worker.verificationDocs?.find(d => d.type === 'aadhaar')?.aadhaarNumber,
      verificationLevel: worker?.verificationLevel,
      idFields: {
        idName: worker?.idName,
        idLocation: worker?.idLocation,
        idDocType: worker?.idDocType,
        idVerifiedAt: worker?.idVerifiedAt,
      },
      idStatus: {
        isVerified: worker?.verificationLevel === 'id' || worker?.verificationLevel === 'police',
        isAadhaar: worker?.idDocType === 'aadhaar',
        aadhaarNumber: worker.verificationDocs?.find(d => d.type === 'aadhaar')?.aadhaarNumber || null,
        verifiedAt: worker?.idVerifiedAt,
      }
    });
  } catch (error) {
    console.error('Error fetching worker verification status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ------------------ ML RECOMMENDATION & SAFETY METRICS ------------------ */
// Compute and persist safety metrics across all workers
app.post('/api/admin/compute-safety-metrics', async (req, res) => {
  try {
    const workers = await workersCollection.find({}).toArray();
    let updated = 0;

    for (const worker of workers) {
      const safetyIncidents = worker.safetyIncidents || 0;
      const excessiveSafetyIncidents = safetyIncidents >= 2;
      const cumulativeSafetyScore = Math.max(0, 100 - (safetyIncidents * 20));

      await workersCollection.updateOne(
        { _id: worker._id },
        {
          $set: {
            excessiveSafetyIncidents,
            cumulativeSafetyScore,
          },
        }
      );
      updated++;
    }
    res.json({
      message: 'Safety metrics computed',
      workersUpdated: updated,
    });
  } catch (err) {
    console.error('Safety metrics computation error:', err);
    res.status(500).json({ error: 'Failed to compute safety metrics' });
  }
});
// Get recommendation insights for a specific worker
app.get('/api/workers/:id/recommendation-insights', async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await workersCollection.findOne({ _id: new ObjectId(id) });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    // Fetch recent hires to compute recommendation score
    const recentHires = await app.locals.db
      .collection('ml_events')
      .find({
        workerId: new ObjectId(id),
        eventType: 'hire',
        createdAt: {
          $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      })
      .toArray();
    const recommendationScore = {
      candidateScore: worker.candidateScore || 0,
      trustScore: worker.trustScore || 0,
      matchScore: worker.matchScore || 0,
      safetyRating: worker.cumulativeSafetyScore || 100,
      recommendationLevel:
        worker.candidateScore >= 80
          ? 'Highly Recommended'
          : worker.candidateScore >= 60
            ? 'Recommended'
            : worker.candidateScore >= 40
              ? 'Consider'
              : 'Caution',
      recentHireCount: recentHires.length,
      rehireRate: recentHires.length > 0 ? (recentHires.filter(h => h.hired === 1).length / recentHires.length * 100).toFixed(0) : 0,
    };
    res.json(recommendationScore);
  } catch (err) {
    console.error('Recommendation insights error:', err);
    res.status(500).json({ error: 'Failed to fetch recommendation insights' });
  }
});

/* ------------------ HIRE STATUS (EMPLOYER) ------------------ */
app.post('/api/workers/:id/hire', async (req, res) => {
  try {
    const { id } = req.params;
    const { employerPhone } = req.body || {};

    if (!employerPhone) {
      return res.status(400).json({ message: 'Employer phone required' });
    }
    const employerUser = await usersCollection.findOne({
      phone: employerPhone,
      role: 'employer',
    });
    if (!employerUser) {
      return res.status(404).json({ message: 'Employer not found' });
    }
    if ((employerUser.safetyIncidents || 0) >= 2) {
      return res.status(403).json({
        message: '🚫 Employer blocked due to safety violations',
      });
    }
    if (employerUser.isBlocked) {
      return res.status(403).json({
        message: 'Your account has been blocked due to safety incidents.',
      });
    }
    const result = await workersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isHired: true,
          currentEmployerPhone: employerPhone,
          lastHiredAt: new Date().toISOString(),
        },
      }
    );
    if (!result.matchedCount) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Log ML event with rich employer & worker context for recommendation learning
    const worker = await workersCollection.findOne({ _id: new ObjectId(id) });
    if (worker) {
      // Compute employer hire history size
      const hireHistory = await workersCollection.countDocuments({
        currentEmployerPhone: employerPhone,
        isHired: true,
      });
      await logMlEvent({
        eventType: 'hire',
        workerId: new ObjectId(id),
        employerId: employerUser._id,
        employerPhone,
        
        // Worker features
        worker_cityArea: worker.cityArea || '',
        worker_experienceYears: Number(worker.experienceYears || 0),
        worker_trustScore: worker.trustScore || 0,
        worker_verificationLevel: worker.verificationLevel || 'unverified',
        worker_safetyIncidents: worker.safetyIncidents || 0,
        worker_feedbackCount: worker.feedbackCount || 0,
        worker_isVerifiedId: (worker.verificationLevel === 'id' || worker.verificationLevel === 'police') ? 1 : 0,
        
        // Employer features
        employer_cityArea: employerUser.city || '',
        employer_hire_history_size: hireHistory,
        employer_safetyIncidents: employerUser.safetyIncidents || 0,
        
        hired: 1,
      });
    }

    res.json({ message: 'Worker marked as hired' });
  } catch (err) {
    console.error('Hire error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/workers/:id/release', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await workersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isHired: false,
          currentEmployerPhone: null,
        },
      }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json({ message: 'Worker marked as available' });
  } catch (err) {
    console.error('Release error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ------------------ HIRE REQUESTS ------------------ */

// POST /api/hire-requests - Employer creates hire request
app.post('/api/hire-requests', async (req, res) => {
  try {
    const { workerId, employerName, phoneNumber, address, householdSize, preferredStartDate, notes } = req.body;
    const employerPhone = req.body.employerPhone; // From auth middleware or request

    if (!workerId || !employerName || !phoneNumber || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate worker exists
    const worker = await workersCollection.findOne({ _id: new ObjectId(workerId) });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Validate employer exists and is not blocked
    const employer = await usersCollection.findOne({ phone: employerPhone, role: 'employer' });
    if (!employer) {
      return res.status(404).json({ error: 'Employer not found' });
    }
    if (employer.isBlocked || (employer.safetyIncidents || 0) >= 2) {
      return res.status(403).json({ error: 'Employer account is blocked' });
    }

    const hireRequest = {
      workerId: new ObjectId(workerId),
      employerId: employer._id,
      workerPhone: worker.emergencyContact,
      employerPhone: employerPhone,
      employerName,
      phoneNumber,
      address,
      householdSize: householdSize || null,
      preferredStartDate: preferredStartDate || null,
      notes: notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await hireRequestsCollection.insertOne(hireRequest);

    res.status(201).json({
      message: 'Hire request sent successfully',
      hireRequest: { ...hireRequest, _id: result.insertedId }
    });
  } catch (err) {
    console.error('Create hire request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/hire-requests/worker - Worker views their hire requests
app.get('/api/hire-requests/worker', async (req, res) => {
  try {
    const workerPhone = req.query.workerPhone; // From auth middleware or request
    const status = req.query.status || 'pending'; // Default to pending

    if (!workerPhone) {
      return res.status(400).json({ error: 'Worker phone required' });
    }

    const query = { workerPhone };
    if (status !== 'all') {
      query.status = status;
    }

    const hireRequests = await hireRequestsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ hireRequests });
  } catch (err) {
    console.error('Get hire requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/hire-requests/:id - Worker accepts/rejects hire request
app.patch('/api/hire-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const workerPhone = req.body.workerPhone; // From auth middleware or request

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be accepted or rejected' });
    }

    const hireRequest = await hireRequestsCollection.findOne({ _id: new ObjectId(id) });
    if (!hireRequest) {
      return res.status(404).json({ error: 'Hire request not found' });
    }

    if (hireRequest.workerPhone !== workerPhone) {
      return res.status(403).json({ error: 'Not authorized to update this request' });
    }

    if (hireRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been responded to' });
    }

    await hireRequestsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          respondedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    );

    res.json({ message: `Hire request ${status} successfully` });
  } catch (err) {
    console.error('Update hire request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/worker/self-hire', async (req, res) => {
  try {
    const {
      emergencyContact,
      employerName,
      employerPhone,
      householdName,
      fromDate
    } = req.body || {};

    if (!emergencyContact || !employerName || !fromDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const worker = await workersCollection.findOne({
      $or: [
        { emergencyContact },
        { 'safety.emergencyContact': emergencyContact },
      ],
    });

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const hireEntry = {
      employerName,
      employerPhone: employerPhone || null,
      householdName: householdName || null,
      fromDate,
      toDate: null,
      createdAt: new Date().toISOString(),
    };

    await workersCollection.updateOne(
      { _id: worker._id },
      {
        $set: {
          isHired: true,
          currentEmployerPhone: employerPhone || null,
          lastHiredAt: fromDate,
        },
        $push: { hireHistory: hireEntry },
      }
    );

    // Log ML event
    await logMlEvent({
      eventType: 'hire',
      workerId: worker._id,
      employerPhone: employerPhone || '',
      trustScore: worker.trustScore || 0,
      verificationLevel: worker.verificationLevel || 'none',
      cityArea: worker.cityArea || '',
      hired: 1,
    });

    res.json({ message: 'Hire status updated', hireEntry });
  } catch (err) {
    console.error('Self hire error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/worker/self-release', async (req, res) => {
  try {
    const { emergencyContact, endDate } = req.body || {};

    if (!emergencyContact) {
      return res.status(400).json({ message: 'Worker phone required' });
    }

    const worker = await workersCollection.findOne({
      $or: [
        { emergencyContact },
        { 'safety.emergencyContact': emergencyContact },
      ],
    });

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const latest = (worker.hireHistory || []).slice(-1)[0];
    if (!latest || latest.toDate) {
      await workersCollection.updateOne(
        { _id: worker._id },
        {
          $set: {
            isHired: false,
            currentEmployerPhone: null,
          },
        }
      );
      return res.json({ message: 'Marked as available' });
    }

    await workersCollection.updateOne(
      { _id: worker._id, 'hireHistory.fromDate': latest.fromDate },
      {
        $set: {
          'hireHistory.$.toDate': endDate || new Date().toISOString(),
          isHired: false,
          currentEmployerPhone: null,
        },
      }
    );

    res.json({ message: 'Job closed, worker available' });
  } catch (err) {
    console.error('Self release error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




/* ------------------ PANIC / INCIDENTS ------------------ */

app.post('/api/worker/panic', async (req, res) => {
  try {
    const { workerPhone, approxLocation, notes, lat, lng } = req.body || {};
    if (!workerPhone) {
      return res.status(400).json({ message: 'Worker phone required' });
    }

    const worker = await workersCollection.findOne(getWorkerLookupFilter(workerPhone));
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const employerPhone = worker.currentEmployerPhone || null;
    const incidentsCollection = req.app.locals.db.collection('incidents');

    const incident = {
      workerId: worker._id,
      workerPhone,
      employerPhone,
      type: 'panic',
      notes: notes || '',
      createdAt: new Date(),
      location: {
        city: worker.city || null,
        areaApprox: worker.cityArea || null,
        rawText: approxLocation || null,
        lat: lat || null,
        lng: lng || null,
      },
      autoSource: 'worker_panic',
      status: 'open',
    };

    let employer = null;
    let count = 0;
    let blocked = false;

    if (employerPhone) {
      employer = await usersCollection.findOne({ phone: employerPhone, role: 'employer' });
      if (employer) {
        incident.employerId = employer._id;
      }
    }

    const incidentInsert = await incidentsCollection.insertOne(incident);

    if (employer) {
      count = (employer.safetyIncidents || 0) + 1;
      blocked = count >= 2 || !!employer.isBlocked;
      await usersCollection.updateOne(
        { _id: employer._id },
        {
          $set: {
            safetyIncidents: count,
            lastSafetyIncidentDate: new Date().toISOString(),
            ...(blocked ? { isBlocked: true, blockedAt: new Date() } : {}),
          },
        }
      );
    }

    if (!(worker.emergencyContactVerified || worker.safety?.emergencyContactVerified)) {
      return res.status(400).json({
        error: 'Emergency contact not verified',
      });
    }

    const emergencySmsTarget =
      worker.emergencyContactPhone ||
      worker.safety?.emergencyContactPhone ||
      null;

    const locationSummary =
      lat && lng
        ? `https://maps.google.com/?q=${lat},${lng}`
        : (approxLocation || worker.cityArea || worker.city || 'their area');

    const smsText =
      `🚨 ALERT: ${worker.name || 'Worker'} feels unsafe.\n` +
      `📍 Location: ${locationSummary}\n` +
      'Please check immediately.';

    const smsResult = await sendSafetySms(emergencySmsTarget, smsText);
    if (!smsResult.sent) {
      console.warn('⚠️ SMS failed:', smsResult.reason);
      await incidentsCollection.updateOne(
        { _id: incidentInsert.insertedId },
        { $set: { smsFailed: true, smsFailureReason: smsResult.reason || 'unknown' } }
      );
    }

    res.json({
      message: 'Panic incident logged and alerts sent.',
      employerPhone,
      safetyIncidents: count,
      blocked,
      smsSent: smsResult.sent,
    });
  } catch (err) {
    console.error('Panic error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/employer/safety-summary/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const employer = await usersCollection.findOne({ phone, role: 'employer' });

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    res.json({
      phone,
      safetyIncidents: employer.safetyIncidents || 0,
      isBlocked: !!employer.isBlocked,
    });
  } catch (err) {
    console.error('Employer safety summary error:', err);
    res.status(500).json({ message: 'Error loading employer safety' });
  }
});

app.get('/api/admin/incident-alerts', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const last5Min = new Date(Date.now() - 5 * 60 * 1000);
    const employers = await usersCollection
      .find({
        role: 'employer',
        $or: [
          { safetyIncidents: { $gte: 2 } },
          { isBlocked: true },
        ],
      })
      .project({
        name: 1,
        phone: 1,
        city: 1,
        safetyIncidents: 1,
        isBlocked: 1,
        blockedAt: 1,
      })
      .sort({ safetyIncidents: -1, blockedAt: -1 })
      .toArray();

    const recentIncidents = await db.collection('incidents')
      .find({
        createdAt: { $gte: last5Min },
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ employers, recentIncidents });
  } catch (err) {
    console.error('Admin incident alerts error:', err);
    res.status(500).json({ message: 'Error loading incident alerts' });
  }
});

/* General incident reporting endpoint */
app.post('/api/incident', async (req, res) => {
  try {
    const { reporterPhone, reportedPhone, type, description } = req.body;

    if (!reporterPhone || !reportedPhone) {
      return res.status(400).json({ error: 'Reporter and reported phone required' });
    }

    const reporter = await usersCollection.findOne({ phone: reporterPhone });
    const reported = await usersCollection.findOne({ phone: reportedPhone });

    if (!reporter || !reported) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Increment incident count on reported user
    const updateResult = await usersCollection.findOneAndUpdate(
      { phone: reportedPhone },
      {
        $inc: { safetyIncidents: 1 },
        $set: { lastSafetyIncidentDate: new Date().toISOString() },
      },
      { returnDocument: 'after' }
    );

    const reportedUser = updateResult.value || {};
    const incidentCount = reportedUser.safetyIncidents || 1;

    // Log raw incident in incidents collection
    const db = req.app.locals.db;
    await db.collection('incidents').insertOne({
      reporterPhone,
      reportedPhone,
      type,
      description,
      createdAt: new Date().toISOString(),
    });

    // Auto-block logic: block if 2+ incidents
    let isBlocked = false;
    if (incidentCount >= 2) {
      await usersCollection.updateOne(
        { phone: reportedPhone },
        { $set: { isBlocked: true } }
      );
      isBlocked = true;
    }

    // Log ML event
    await logMlEvent({
      eventType: 'incident',
      reporterId: reporter._id,
      reportedId: reported._id,
      type,
      reporterPhone,
      reportedPhone,
    });

    res.json({
      message: 'Incident logged successfully',
      safetyIncidents: incidentCount,
      isBlocked,
    });
  } catch (err) {
    console.error('Incident error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ------------------ PDF (old one removed, now covered by multer route above) ------------------ */

// This route is now handled by the multer /api/workers/:id/generate-pdf defined above;
// you can safely remove the previous raw /api/workers/:id/generate-pdf definition.

app.get('/api/workers/:phone/feedbacks', async (req, res) => {
  try {
    const { phone } = req.params;

    const worker = await workersCollection.findOne({
      $or: [
        { emergencyContact: phone },
        { 'safety.emergencyContact': phone }
      ]
    });

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json({
      workerName: worker.name,
      totalFeedbacks: worker.feedbackCount || 0,
      feedbacks: worker.feedbacks || []
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ------------------ HEALTH ------------------ */

app.get('/api/admin/incidents', async (req, res) => {
  try {
    const incidents = await app.locals.db.collection('incidents').find(
      {},
      { sort: { createdAt: -1 }, limit: 100 }
    ).toArray();

    res.json({ incidents });
  } catch (err) {
    console.error('admin/incidents error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    // Read from materialized stats collection
    const today = new Date().toISOString().slice(0, 10);
    const stats = await app.locals.db.collection(STATS_COLLECTION).findOne({ date: today });

    const defaultStats = {
      workersCount: 0,
      employersCount: 0,
      activeIncidents: 0,
    };

    const currentStats = stats || defaultStats;

    res.json({
      ...currentStats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ error: 'Health check failed' });
  }
});

app.get('/', (_, res) => {
  res.send('KaamWali.AI backend running');
});

/* ------------------ MATERIALIZED VIEWS FOR METRICS ------------------ */

const STATS_COLLECTION = 'stats';

async function recomputeDailyStats(db) {
  const workersCount = workersCollection ? await workersCollection.countDocuments() : 0;
  const employersCount = usersCollection ? await usersCollection.countDocuments({ role: 'employer' }) : 0;

  const activeIncidents = await db.collection('incidents').countDocuments({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });

  await db.collection(STATS_COLLECTION).updateOne(
    { date: new Date().toISOString().slice(0, 10) }, // YYYY-MM-DD
    {
      $set: {
        workersCount,
        employersCount,
        activeIncidents,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
}

/* ------------------ ML EVENT LOGGING ------------------ */

async function logMlEvent(event) {
  try {
    const db = app.locals.db;
    if (!db) return;
    await db.collection('ml_events').insertOne({
      ...event,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('ml_events log error:', err);
  }
}

/* ------------------ SERVER ------------------ */

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    const db = await connectDB();
    workersCollection = db.collection('workers');
    usersCollection = db.collection('users');
    tempOtpCollection = db.collection('temp_otps');
    hireRequestsCollection = db.collection('hireRequests');
    app.locals.db = db; // expose for incidents etc. [web:71]
    console.log('MongoDB connected');

    // Add indexes for search performance
    if (workersCollection) {
      await workersCollection.createIndex({ cityArea: 1 });
      await workersCollection.createIndex({ city: 1 });
      await workersCollection.createIndex({ skills: 1 });
      await workersCollection.createIndex({ trustScore: -1 }); // critical for sort
      await workersCollection.createIndex({ experienceYears: -1 });
      await workersCollection.createIndex({ verificationLevel: 1 }); // id / police
      await workersCollection.createIndex({ updatedAt: 1 }); // for trust recalc grace period
      console.log('MongoDB indexes created');
    }
  } catch (err) {
    console.error('MongoDB failed, using memory mode');
    workersCollection = null;
    usersCollection = null;
    tempOtpCollection = null;
  }

  app.listen(PORT, () => {
    console.log(`Backend running on ${PORT}`);

    // Optional: batch trust recalc every 12 hours for workers with >= 3 feedbacks
    if (workersCollection) {
      setInterval(async () => {
        try {
          const workersToUpdate = await workersCollection
            .find({ feedbackCount: { $gte: 3 } })
            .toArray();

          for (const worker of workersToUpdate) {
            await recomputeWorkerTrust(worker._id);
          }
          console.log(`Batch trust recalc completed for ${workersToUpdate.length} workers`);
        } catch (err) {
          console.error('Batch trust recalc error:', err);
        }
      }, 12 * 60 * 60 * 1000); // 12 hours
    }

    // Daily stats recomputation
    if (app.locals.db) {
      // Run immediately on startup
      recomputeDailyStats(app.locals.db).catch(console.error);

      // Then run daily
      setInterval(() => {
        recomputeDailyStats(app.locals.db).catch(console.error);
      }, 24 * 60 * 60 * 1000); // 24 hours
    }
  });
})();
