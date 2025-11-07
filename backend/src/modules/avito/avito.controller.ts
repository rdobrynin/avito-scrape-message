import { Body, Controller, Post } from '@nestjs/common';
import { AvitoService } from './avito.service';
import { CreateLoginDto } from './dto/login.dto';
import { ILoginResponse } from './interfaces/login.interface';
import { Logger } from 'nestjs-pino';

@Controller('avito')
export class AvitoController {
  constructor(
    private readonly avitoService: AvitoService,
    private readonly logger: Logger,
  ) {}

  @Post('login')
  async login(@Body() createLoginDto: CreateLoginDto): Promise<ILoginResponse> {
    this.logger.log(`Try access: ${createLoginDto.username}`);

    return await this.avitoService.loginToAvito(
      createLoginDto.username,
      createLoginDto.password,
    );
  }

  @Post('check-profile')
  async checkProfile(@Body() createLoginDto: CreateLoginDto): Promise<any> {
    return this.avitoService.performActionAfterLogin(
      createLoginDto.username,
      createLoginDto.password,
      async (page) => {
        await page.goto('https://www.avito.ru/profile', {
          waitUntil: 'networkidle2',
        });

        const profileInfo = await page.evaluate(() => {
          const usernameElement = document.querySelector(
            '[data-marker="header/username"]',
          );
          return {
            username: usernameElement?.textContent?.trim(),
            currentUrl: window.location.href,
          };
        });

        return { success: true, profileInfo };
      },
    );
  }
}
