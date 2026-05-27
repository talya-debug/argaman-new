import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { html } = req.body;
  if (!html) {
    return res.status(400).json({ error: 'Missing html' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'PDF generation failed' });
  } finally {
    if (browser) await browser.close();
  }
}
