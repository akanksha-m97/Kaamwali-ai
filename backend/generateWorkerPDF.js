import puppeteer from "puppeteer";
import { workerResumeTemplate } from './templates/workerResumeTemplate.js';
//uploads/worker_123.pdf--output path
export default async function generateWorkerPDF(worker, outputPath, language = 'en') {
  //puppeteer starts a browswer which is headless means not visible on screen
 const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage"
  ]
});
//Browser
// ↓
//New Tab
  const page = await browser.newPage();

  const html = workerResumeTemplate(worker, language);

  //loading generated html into puppeteer browser
  await page.setContent(html, {
  waitUntil: "domcontentloaded",
  timeout: 60000
});

await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "20px",
      bottom: "20px"
    }
  });

  await browser.close();
}
