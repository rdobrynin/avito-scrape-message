import { Controller, Post, Body, Get } from '@nestjs/common';
import { AvitoService } from './avito.service';
import { LoginDto } from './dto/login.dto';

@Controller('avito')
export class AvitoController {
  constructor(private readonly avitoService: AvitoService) {}

  @Post('start')
  async start(@Body() loginDto: LoginDto) {
    await this.avitoService.startListening(
      loginDto.username,
      loginDto.password,
    );
    return { status: 'Listening started' };
  }

  @Post('stop')
  async stop() {
    await this.avitoService.stopListening();
    return { status: 'Listening stopped' };
  }

  @Get('status')
  status() {
    return { isRunning: this.avitoService.isRunning };
  }
}
