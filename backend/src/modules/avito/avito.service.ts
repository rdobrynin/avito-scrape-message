import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';
import { IChatInfo } from './interfaces/chat.interface';
import { MessageDto } from './dto/message.dto';
import { ConfigService } from '@nestjs/config';
import { EventGateway } from '../event/event.gateway';

@Injectable()
export class AvitoService {
  private readonly logger = new Logger(AvitoService.name);
  private browser: Browser;

  constructor(
    private configService: ConfigService,
    private eventGateway: EventGateway,
  ) {}

  async login(email: string, password: string): Promise<MessageDto> {
    let page: Page;

    try {
      this.logger.log('Starting browser...');

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

      this.logger.log(
        `Browser started in mode: ${isHeadless ? 'headless' : 'visible'}`,
      );

      page = await this.browser.newPage();

      await page.setViewport({ width: 1920, height: 1080 });

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      this.logger.log('Navigating to Avito login page...');
      await page.goto('https://www.avito.ru/profile/login', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      this.logger.log('Page loaded, waiting for form...');

      await page.waitForSelector('input[type="text"], input[type="email"]', {
        timeout: 15000,
      });

      this.logger.log('Entering email...');
      await page.type('input[type="text"], input[type="email"]', email, {
        delay: 100,
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      this.logger.log('Looking for submit button...');
      const continueButton = await page.$('button[type="submit"]');
      if (continueButton) {
        this.logger.log('Clicking "Continue" button...');
        await continueButton.click();
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      this.logger.log('Waiting for password field...');
      const passwordInput = await page.$('input[type="password"]');

      if (passwordInput) {
        this.logger.log('Entering password...');
        await passwordInput.click();
        await page.keyboard.type(password, { delay: 100 });

        await new Promise((resolve) => setTimeout(resolve, 1500));

        const loginButton = await page.$('button[type="submit"]');
        if (loginButton) {
          this.logger.log('Clicking "Login" button...');
          await loginButton.click();
        }
      }

      this.logger.log('Waiting for successful login...');
      try {
        await page.waitForNavigation({
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        this.logger.log('Navigation completed');
      } catch (navError) {
        this.logger.warn('Navigation timeout, checking current URL...');
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const currentUrl = page.url();
      this.logger.log(`Current URL: ${currentUrl}`);

      const cookies = await page.cookies();

      try {
        await page.screenshot({
          path: './logs/login-result.png',
          fullPage: true,
        });
        this.logger.log('Screenshot saved to ./logs/login-result.png');
      } catch (screenshotError) {
        this.logger.warn('Failed to save screenshot:', screenshotError.message);
      }

      const isSuccess =
        currentUrl.includes('/profile') || currentUrl.includes('/personal');

      await this.browser.close();

      if (isSuccess) {
        this.logger.log('Successfully logged into Avito account!');
        // await this.getMessagesFromUser(cookies, this.configService.get<string>('AVITO_SUBSCRIBER_NAME')!);
        return {
          success: true,
          message: 'Successfully logged into account',
          cookies,
        };
      } else {
        this.logger.warn(
          'Login not confirmed, additional verification may be required',
        );
        return {
          success: false,
          message: 'Additional verification required or invalid credentials',
          cookies,
        };
      }
    } catch (error) {
      this.logger.error('Login error:', error.message);

      // @ts-ignore
      if (page) {
        try {
          await page.screenshot({
            path: './logs/error-screenshot.png',
            fullPage: true,
          });
          this.logger.log(
            'Error screenshot saved to ./logs/error-screenshot.png',
          );
        } catch (screenshotError) {
          this.logger.warn('Failed to save error screenshot');
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

  private async getMessagesFromUser(
    cookies: any[],
    username: string,
  ): Promise<IChatInfo> {
    let page: Page;

    try {
      this.logger.log(`Getting messages from user: ${username}`);

      const isHeadless = process.env.HEADLESS !== 'false';

      this.browser = await puppeteer.launch({
        // @ts-ignore
        headless: isHeadless ? 'new' : false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });

      page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      await page.setCookie(...cookies);

      this.logger.log('Navigating to messenger page...');
      await page.goto('https://www.avito.ru/messenger', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      this.logger.log(`Looking for chat with user: ${username}`);

      const chatFound = await page.evaluate((targetUsername) => {
        const userTitles = document.querySelectorAll(
          '[data-marker="channels/user-title"]',
        );

        for (const titleElement of userTitles) {
          const text = titleElement.textContent?.trim();
          if (text && text.includes(targetUsername)) {
            const chatItem = titleElement.closest(
              '[data-marker^="messenger/channel"]',
            );
            if (chatItem) {
              (chatItem as HTMLElement).click();
              return true;
            }
          }
        }
        return false;
      }, username);

      if (!chatFound) {
        this.logger.warn(`Chat with user ${username} not found`);
        await this.browser.close();
        return {
          username,
          messages: [],
          totalMessages: 0,
        };
      }

      this.logger.log('Chat found, loading messages...');

      await new Promise((resolve) => setTimeout(resolve, 3000));

      this.logger.log('Scrolling to load all messages...');
      await this.scrollToLoadAllMessages(page);

      const messages = await page.evaluate((targetUsername) => {
        const messageElements = document.querySelectorAll(
          '[data-marker^="messenger/message"]',
        );
        const extractedMessages: any[] = [];

        messageElements.forEach((msgElement, index) => {
          try {
            const isIncoming =
              msgElement.hasAttribute('data-marker') &&
              msgElement.getAttribute('data-marker')?.includes('incoming');

            if (isIncoming) {
              const textElement = msgElement.querySelector(
                '[data-marker="messenger/message/text"]',
              );
              const text = textElement?.textContent?.trim() || '';

              const timeElement = msgElement.querySelector(
                '[data-marker="messenger/message/time"]',
              );
              const timestamp = timeElement?.textContent?.trim() || '';

              const isUnread =
                msgElement.classList.contains('unread') ||
                msgElement.hasAttribute('data-unread');

              extractedMessages.push({
                id: `msg-${index}`,
                username: targetUsername,
                text,
                timestamp,
                isUnread,
              });
            }
          } catch (err) {
            console.error('Error extracting message:', err);
          }
        });

        return extractedMessages;
      }, username);

      this.logger.log(
        `Found ${messages.length} messages from user ${username}`,
      );

      try {
        await page.screenshot({
          path: `./logs/messages-${username}.png`,
          fullPage: true,
        });
        this.logger.log(`Screenshot saved to ./logs/messages-${username}.png`);
      } catch (screenshotError) {
        this.logger.warn('Failed to save screenshot');
      }

      await this.browser.close();

      return {
        username,
        messages,
        totalMessages: messages.length,
      };
    } catch (error) {
      this.logger.error('Error getting messages:', error.message);

      // @ts-ignore
      if (page) {
        try {
          await page.screenshot({
            path: './logs/error-messages.png',
            fullPage: true,
          });
        } catch (screenshotError) {
          this.logger.warn('Failed to save error screenshot');
        }
      }

      if (this.browser) {
        await this.browser.close();
      }

      throw error;
    }
  }

  private async scrollToLoadAllMessages(page: Page): Promise<void> {
    try {
      const messagesContainer = await page.$(
        '[data-marker="messenger/messages-list"]',
      );

      if (!messagesContainer) {
        this.logger.warn('Messages container not found');
        return;
      }

      let previousHeight = 0;
      let currentHeight = await page.evaluate((container) => {
        return container?.scrollHeight || 0;
      }, messagesContainer);

      while (previousHeight !== currentHeight) {
        previousHeight = currentHeight;

        await page.evaluate((container) => {
          if (container) {
            container.scrollTop = 0;
          }
        }, messagesContainer);

        await new Promise((resolve) => setTimeout(resolve, 1500));

        currentHeight = await page.evaluate((container) => {
          return container?.scrollHeight || 0;
        }, messagesContainer);

        this.logger.log(`Messages loaded, height: ${currentHeight}`);
      }

      this.logger.log('All messages loaded');
    } catch (error) {
      this.logger.error('Scroll error:', error.message);
    }
  }

  async checkProfile(cookies: any[]): Promise<any> {
    let page: Page;

    try {
      const isHeadless = process.env.HEADLESS !== 'false';

      this.browser = await puppeteer.launch({
        // @ts-ignore
        headless: isHeadless ? 'new' : false,
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
      this.logger.error('Profile check error:', error.message);

      if (this.browser) {
        await this.browser.close();
      }

      throw error;
    }
  }
}
