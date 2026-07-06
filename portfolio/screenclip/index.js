const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function screenshotPortfolioSites() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // Path to portfolio folder
  const portfolioPath = path.join(__dirname, '../portfolio');

  // Read folder names
  const folders = fs.readdirSync(portfolioPath).filter(item => {
    const itemPath = path.join(portfolioPath, item);
    return fs.statSync(itemPath).isDirectory();
  });

  console.log(`Found ${folders.length} folders in portfolio: ${folders.join(', ')}`);

  for (const folder of folders) {
    const folderPath = path.join(portfolioPath, folder);
    const indexPath = path.join(folderPath, 'index.html');
    const imagesPath = path.join(folderPath, 'images');

    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      console.log(`Skipping ${folder}: index.html not found`);
      continue;
    }

    // Ensure images folder exists
    if (!fs.existsSync(imagesPath)) {
      fs.mkdirSync(imagesPath, { recursive: true });
    }

    const baseUrl = `file://${indexPath.replace(/\\/g, '/')}`;

    try {
      console.log(`Processing: ${folder} - ${baseUrl}`);
      page.setDefaultNavigationTimeout(60000);
      await page.goto(baseUrl, { waitUntil: 'load' });
      await page.waitForTimeout(2000);

      // Screenshot the homepage as main.png
      const mainScreenshotPath = path.join(imagesPath, 'main.png');
      await page.screenshot({ path: mainScreenshotPath, fullPage: false });
      console.log(`Screenshot saved: main.png`);

      // Get all internal links from the homepage
      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(a => a.href).filter(href => href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:'));
      });

      // Filter to internal links (relative or file:// to the same folder)
      const internalLinks = links.filter(link => {
        try {
          const linkUrl = new URL(link, baseUrl);
          return linkUrl.protocol === 'file:' && linkUrl.pathname.startsWith(new URL(baseUrl).pathname.replace(/\/[^\/]*$/, '/'));
        } catch {
          return false;
        }
      });

      // Remove duplicates and sort
      const uniqueLinks = [...new Set(internalLinks)].sort();
      // Remove the baseUrl if present, since we already did main.png
      const filteredLinks = uniqueLinks.filter(link => link !== baseUrl);

      console.log(`Found ${filteredLinks.length} additional internal links on ${folder}`);

      // Screenshot each additional unique internal link
      for (const link of filteredLinks) {
        try {
          console.log(`Processing: ${link}`);
          await page.goto(link, { waitUntil: 'load' });
          await page.waitForTimeout(2000);
          const title = await page.title();
          const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const filename = `${sanitizedTitle}.png`;
          const filepath = path.join(imagesPath, filename);
          await page.screenshot({ path: filepath, fullPage: false });
          console.log(`Screenshot saved: ${filename}`);
        } catch (error) {
          console.error(`Error processing ${link}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${folder}: ${error.message}`);
    }
  }

  await browser.close();
}

console.log('Starting screenshot process for portfolio sites');
screenshotPortfolioSites().then(() => {
  console.log('Screenshot process completed.');
}).catch(console.error);