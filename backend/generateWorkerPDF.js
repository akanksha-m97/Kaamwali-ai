import puppeteer from "puppeteer";
import { workerResumeTemplate } from './templates/workerResumeTemplate.js';
export default async function generateWorkerPDF(worker, outputPath) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  const html = workerResumeTemplate(worker);

  await page.setContent(html, { waitUntil: "networkidle0" });

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
