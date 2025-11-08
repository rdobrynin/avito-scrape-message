// src/avito/avito.service.ts
import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventGateway } from '../event/event.gateway';
import * as puppeteer from 'puppeteer';

interface ListeningStatus {
  isRunning: boolean;
  lastCheck: Date | null;
  error: string | null;
}

@Injectable()
export class AvitoService implements OnApplicationBootstrap, OnModuleDestroy {
  private browser: puppeteer.Browser | null = null;
  private page: puppeteer.Page | null = null;
  isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly logger = new Logger(AvitoService.name);

  // Monitoring configuration
  private readonly POLL_INTERVAL = 10000; // 10 seconds
  private status: ListeningStatus = {
    isRunning: false,
    lastCheck: null,
    error: null,
  };

  constructor(
    private configService: ConfigService,
    private eventGateway: EventGateway,
  ) {}

  async onApplicationBootstrap() {
    const login = this.configService.get<string>('AVITO_LOGIN');
    const password = this.configService.get<string>('AVITO_PASSWORD');
    const subscriberName = this.configService.get<string>(
      'AVITO_SUBSCRIBER_NAME',
    );

    if (login && password) {
      this.logger.log('Auto-starting Avito listening...');
      await this.startListening(login, password);
    } else {
      this.logger.warn(
        'AVITO_LOGIN or AVITO_PASSWORD not set. Listening not started automatically.',
      );
    }
  }

  async startListening(
    login: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> {
    if (this.isRunning) {
      return { success: false, message: 'Listening is already running' };
    }

    try {
      this.logger.log('Starting Avito listening...');

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

      this.page = await this.browser.newPage();

      await this.page.setViewport({ width: 1920, height: 1080 });

      // Hide authorization
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });

      await this.page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await this.login(login, password);

      this.isRunning = true;
      // this.startPolling();

      this.logger.log('Avito listener started successfully');
      return { success: true, message: 'Listener started successfully' };
    } catch (error) {
      this.logger.error(`Failed to start listening: ${error.message}`);
      await this.cleanup();
      return {
        success: false,
        message: `Failed to start listening: ${error.message}`,
      };
    }
  }

  private async login(login: string, password: string) {
    if (!this.page) throw new Error('Page not initialized');

    this.logger.log('Going to Avito page...');
    await this.page.goto('https://www.avito.ru/profile/login', {
      waitUntil: 'domcontentloaded',
      timeout: 6000,
    });

    this.logger.log('The page is loaded, waiting fo form...');


    await this.page.waitForSelector('input[type="text"]', { timeout: 15000 });

    this.logger.log('Entering email...');
    await this.page.type('input[type="text"]', login, { delay: 100 });

    await new Promise(resolve => setTimeout(resolve, 1500));


    // Looking for enter or submit
    this.logger.log('Searching submit button...');
    const continueButton = await this.page.$('button[type="submit"]');
    if (continueButton) {
      this.logger.log('Pressing button Continue...');
      await continueButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    this.logger.log('Check for password field...');
    const passwordInput = await this.page.$('input[type="password"]');

    if (passwordInput) {
      this.logger.log('Entering password...');
      await passwordInput.click();
      await this.page.keyboard.type(password, { delay: 100 });

      await new Promise(resolve => setTimeout(resolve, 1500));

      const loginButton = await this.page.$('button[type="submit"]');

      if (loginButton) {
        this.logger.log('Pressing button "Enter"...');
        await loginButton.click();
      }
    }

    this.logger.log('Waiting success enter...')

    try {
      await this.page.waitForNavigation({
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      this.logger.log('Navigation has been completed');
    } catch (navError) {
      console.log(navError);
      this.logger.warn('Navigation timeout, checking login status...');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const currentUrl = this.page.url();
    this.logger.log(`Current URL: ${currentUrl}`);

    // const cookies = await this.page.cookies();

    try {
      await this.page.screenshot({ path: './logs/login-result.png', fullPage: true });
      this.logger.log('Screenshot saved to ./logs/login-result.png');
    } catch (screenshotError) {
      this.logger.warn('Not success save screenshot:', screenshotError.message);
    }

    const isSuccess = currentUrl.includes('/profile') || currentUrl.includes('/personal');


    if (!isSuccess) {
      return {
        success: false,
        message: 'Require additional information or invalid credentials',
      };
    }


    //
    // await this.page.waitForSelector('[data-marker="login-form/login"]', {
    //   timeout: 10000,
    // });
    //
    // await this.page.type('[data-marker="login-form/login"]', login, {
    //   delay: 100,
    // });
    // await this.page.type('[data-marker="login-form/password"]', password, {
    //   delay: 100,
    // });
    // await this.page.click('[data-marker="login-form/submit"]');
    //
    // // Wait for navigation and verify login
    // try {
    //   await this.page.waitForNavigation({
    //     waitUntil: 'networkidle2',
    //     timeout: 15000,
    //   });
    // } catch (error) {
    //   this.logger.warn('Navigation timeout, checking login status...');
    // }

    // Verify successful login
    // const isLoggedIn = await this.verifyLogin();
    // if (!isLoggedIn) {
    //   throw new Error('Login failed - check credentials');
    // }

    this.logger.log('Successfully logged into Avito');
  }

  // private async verifyLogin(): Promise<boolean> {
  //   if (!this.page) return false;
  //
  //   try {
  //     // Check for user profile element or other login indicators
  //     const checks = [
  //       this.page
  //         .waitForSelector('[data-marker="header/username"]', { timeout: 5000 })
  //         .then(() => true)
  //         .catch(() => false),
  //       this.page
  //         .waitForSelector('[data-marker="profile-menu/trigger"]', {
  //           timeout: 5000,
  //         })
  //         .then(() => true)
  //         .catch(() => false),
  //     ];
  //
  //     const results = await Promise.all(checks);
  //     return results.some((result) => result);
  //   } catch (error) {
  //     return false;
  //   }
  // }

  private startPolling(): void {
    this.monitoringInterval = setInterval(async () => {
      if (!this.isRunning || !this.page) return;

      try {
        await this.checkForNewMessages();
        this.status.lastCheck = new Date();
        this.status.error = null;
      } catch (error) {
        this.status.error = error.message;
        this.logger.error(`Error checking messages: ${error.message}`);
      }
    }, this.POLL_INTERVAL);
  }

  private async checkForNewMessages() {
    if (!this.page) return;

    await this.page.goto('https://www.avito.ru/profile/messages', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await this.page.waitForSelector('[data-marker*="message"]', {
      timeout: 10000,
    });

    const messages = await this.page.$$eval(
      '[data-marker*="message"]',
      (messageElements) => {
        return messageElements.map((element) => ({
          text: element.textContent?.trim() || '',
          timestamp: new Date().toISOString(),
          id: Math.random().toString(36).substr(2, 9),
        }));
      },
    );

    messages.forEach((message) => {
      this.eventGateway.server.emit('newMessage', message);
    });

    if (messages.length > 0) {
      this.logger.log(`Found ${messages.length} new messages`);
    }
  }

  async stopListening(): Promise<{ success: boolean; message: string }> {
    if (!this.isRunning) {
      return { success: false, message: 'Listening is not running' };
    }

    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    await this.cleanup();
    this.logger.log('Avito listening stopped');

    return { success: true, message: 'Listening stopped successfully' };
  }

  getStatus(): ListeningStatus {
    return { ...this.status, isRunning: this.isRunning };
  }

  private async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async onModuleDestroy() {
    await this.stopListening();
  }
}
