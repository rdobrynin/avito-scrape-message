import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AvitoService } from './avito.service';
import { LoginDto } from './dto/login.dto';

@Controller('avito')
export class AvitoController {
  constructor(private readonly avitoService: AvitoService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.avitoService.login(loginDto.email, loginDto.password);
  }

  @Post('check-profile')
  async checkProfile(@Body() body: { cookies: any[] }) {
    return await this.avitoService.checkProfile(body.cookies);
  }

  @Get('health')
  health() {
    return { status: 'ok', message: 'Avito Automation API работает' };
  }
}
