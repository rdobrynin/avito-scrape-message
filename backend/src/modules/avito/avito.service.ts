import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';

@Injectable()
export class AvitoService {
  private readonly logger = new Logger(AvitoService.name);
  private browser: Browser;

  async login(email: string, password: string): Promise<{ success: boolean; message: string; cookies?: any[] }> {
    let page: Page;

    try {
      this.logger.log('Launching browser...');

      const isHeadless = process.env.HEADLESS !== 'false';

      this.browser = await puppeteer.launch({
        // @ts-ignore
        headless: isHeadless ? 'new' : false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });

      this.logger.log(`Browser launched in mode: ${isHeadless ? 'headless' : 'visible'}`);

      page = await this.browser.newPage();

      await page.setViewport({ width: 1920, height: 1080 });

      // Hide authorization
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });

      await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      this.logger.log('Going to Avito page...');
      await page.goto('https://www.avito.ru/profile/login', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      this.logger.log('The page is loaded, waiting fo form...');

      await page.waitForSelector('input[type="text"]', { timeout: 15000 });

      this.logger.log('Entering email...');
      await page.type('input[type="text"]', email, { delay: 100 });

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Looking for enter or submit
      this.logger.log('Searching submit button...');
      const continueButton = await page.$('button[type="submit"]');
      if (continueButton) {
        this.logger.log('Pressing button Continue...');
        await continueButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      this.logger.log('Check for password field...');
      const passwordInput = await page.$('input[type="password"]');

      if (passwordInput) {
        this.logger.log('Entering password...');
        await passwordInput.click();
        await page.keyboard.type(password, { delay: 100 });

        await new Promise(resolve => setTimeout(resolve, 1500));

        const loginButton = await page.$('button[type="submit"]');
        if (loginButton) {
          this.logger.log('Pressing button "Enter"...');
          await loginButton.click();
        }
      }

      this.logger.log('Waiting success enter...');
      try {
        await page.waitForNavigation({
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        this.logger.log('Navigation has been completed');
      } catch (navError) {
        this.logger.warn('Timeout on navigation, checkout current URL...');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const currentUrl = page.url();
      this.logger.log(`Current URL: ${currentUrl}`);

      const cookies = await page.cookies();

      try {
        await page.screenshot({ path: './logs/login-result.png', fullPage: true });
        this.logger.log('Screenshot saved to ./logs/login-result.png');
      } catch (screenshotError) {
        this.logger.warn('Not success save screenshot:', screenshotError.message);
      }

      const isSuccess = currentUrl.includes('/profile') || currentUrl.includes('/personal');

      await this.browser.close();

      if (isSuccess) {
        this.logger.log('Success enter in profile settings in Avito!');
        return {
          success: true,
          message: 'Success access in profile',
          cookies,
        };
      } else {
        this.logger.warn('Access not confirmed, perhaps need authorization');
        return {
          success: false,
          message: 'Require additional information or invalid creds',
          cookies,
        };
      }

    } catch (error) {
      this.logger.error('Error in access:', error.message);

      // @ts-ignore
      if (page) {
        try {
          await page.screenshot({ path: './logs/error-screenshot.png', fullPage: true });
          this.logger.log('Error screenshot saved in ./logs/error-screenshot.png');
        } catch (screenshotError) {
          this.logger.warn('Screenshot didn\'t saved properly');
        }
      }

      if (this.browser) {
        await this.browser.close();
      }

      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  async checkCookies(cookies: any[]): Promise<any> {
    let page: Page;

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });

      page = await this.browser.newPage();

      await page.setCookie(...cookies);

      await page.goto('https://www.avito.ru/profile', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      const profileData = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
        };
      });

      await this.browser.close();

      return profileData;

    } catch (error) {
      this.logger.error('Error with validation profile:', error.message);

      if (this.browser) {
        await this.browser.close();
      }

      throw error;
    }
  }
}
