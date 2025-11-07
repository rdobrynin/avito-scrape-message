import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import * as puppeteer from 'puppeteer';
import { ConfigService } from '@nestjs/config';
import { ILoginResponse } from './interfaces/login.interface';

@Injectable()
export class AvitoService implements OnModuleDestroy {
  private browser: puppeteer.Browser | null = null;

  constructor(
    private configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless:
          this.configService.get('PUPPETEER_HEADLESS', 'true') === 'true',
        executablePath:
          process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  async loginToAvito(login: string, password: string): Promise<ILoginResponse> {
    let page: puppeteer.Page | null = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      );

      this.logger.log('Redirect to Avito page...');
      await page.goto('https://www.avito.ru/#login', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await page.waitForSelector('[data-marker="login-form/login"]', {
        timeout: 10000,
      });

      await page.type('[data-marker="login-form/login"]', login, {
        delay: 100,
      });

      await page.type('[data-marker="login-form/password"]', password, {
        delay: 100,
      });

      await page.click('[data-marker="login-form/submit"]');

      try {
        await page.waitForNavigation({
          waitUntil: 'networkidle2',
          timeout: 10000,
        });
      } catch (error) {
        this.logger.warn('No any navigation, check profile...');
      }

      const isLoggedIn = await this.checkLoginSuccess(page);

      if (isLoggedIn) {
        const cookies = await page.cookies();
        this.logger.log('Success access to Avito');

        await page.screenshot({ path: './storage/avito-login-success.png' });

        return {
          success: true,
          message: 'Success access to Avito',
          cookies,
        };
      } else {
        const errorText = await this.checkForErrors(page);
        return {
          success: false,
          error: errorText || 'Can not access to Avito',
        };
      }
    } catch (error) {
      this.logger.error(`Error access to Avito: ${error.message}`);

      if (page) {
        await page.screenshot({ path: './storage/avito-login-error.png' });
      }

      return {
        success: false,
        error: error.message,
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private async checkLoginSuccess(page: puppeteer.Page): Promise<boolean> {
    try {
      const checks = [
        page
          .waitForSelector('[data-marker="header/username"]', { timeout: 5000 })
          .then(() => true)
          .catch(() => false),
        page
          .waitForSelector('[data-marker="profile-menu/trigger"]', {
            timeout: 5000,
          })
          .then(() => true)
          .catch(() => false),
        page.url().includes('/profile') || page.url().includes('/favorites'),
      ];

      const results: boolean[] = await Promise.all(checks);
      return results.some((result) => result === true);
    } catch (error) {
      return false;
    }
  }

  private async checkForErrors(page: puppeteer.Page): Promise<string | null> {
    try {
      const errorSelectors: string[] = [
        '[data-marker="login-form/error"]',
        '.error-message',
        '.text-danger',
        '[class*="error"]',
      ];

      for (const selector of errorSelectors) {
        const errorElement = await page.$(selector);
        if (errorElement) {
          const errorText = await page.evaluate(
            (el) => el.textContent,
            errorElement,
          );
          if (errorText && errorText.trim()) {
            return errorText.trim();
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async performActionAfterLogin(
    login: string,
    password: string,
    action: (page: puppeteer.Page) => Promise<any>,
  ) {
    let page: puppeteer.Page | null = null;

    try {
      const loginResult = await this.loginToAvito(login, password);
      if (!loginResult.success) {
        throw new Error(`Error: ${loginResult.error}`);
      }

      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Set cookies for session
      if (loginResult.cookies) {
        await page.setCookie(...loginResult.cookies);
      }

      return await action(page);
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}
