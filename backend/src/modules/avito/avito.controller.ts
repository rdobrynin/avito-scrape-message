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

    return await this.avitoService.login(
      createLoginDto.username,
      createLoginDto.password,
    );
  }

  @Post('check-cookies')
  async checkCookies(@Body() body: { cookies: any[] }) {
    return await this.avitoService.checkCookies(body.cookies);
  }
}
