// backend/routes/i18n.js
import express from 'express';
import base from '../i18nBase.js';

const router = express.Router();

router.get('/i18n', (req, res) => {
  const lang = (req.query.lang || 'en').toLowerCase();

  const langData = base[lang] || base.en;
  const result = {};

  const allSections = new Set([
    ...Object.keys(base.en),
    ...Object.keys(langData),
  ]);

  allSections.forEach((section) => {
    const sectionBase = base.en[section] || {};
    const sectionLang = langData[section] || {};
    result[section] = {};

    const allKeys = new Set([
      ...Object.keys(sectionBase),
      ...Object.keys(sectionLang),
    ]);

    allKeys.forEach((key) => {
      result[section][key] = sectionLang[key] || sectionBase[key] || '';
    });
  });

  res.json(result);
});

export default router;
